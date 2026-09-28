from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Review, Finding, Evidence

router = APIRouter()

@router.get("/{review_id}")
def get_report(review_id: int, db: Session = Depends(get_db)):
    """
    Build and return the full lecturer report from persisted DB data.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    findings = db.query(Finding).filter(Finding.review_id == review_id).all()
    
    def serialize_finding(f):
        evidence = db.query(Evidence).filter(Evidence.finding_id == f.id).all()
        return {
            "id": f.id,
            "claim": f.claim,
            "category": f.category,
            "severity": f.severity,
            "location": f.location,
            "status": f.status,
            "authority": f.authority,
            "recommendation": f.recommendation,
            "evidence": [
                {"observation": e.observation, "value": e.value, "method": e.method, "confidence": e.confidence}
                for e in evidence
            ]
        }
    
    verified = [f for f in findings if f.status == "VERIFIED" and f.authority == "AUTOMATIC"]
    needs_review = [f for f in findings if f.authority in ["LECTURER", "QUALIFIED_AI"] or f.status == "INSUFFICIENT"]
    contradicted = [f for f in findings if f.status == "CONTRADICTED"]
    
    return {
        "review_id": review_id,
        "status": review.status,
        "metrics": {
            "total": len(findings),
            "verified_automatic": len(verified),
            "needs_review": len(needs_review),
            "contradicted": len(contradicted),
            "approved": len([f for f in findings if f.status == "APPROVED"]),
            "rejected": len([f for f in findings if f.status == "REJECTED"])
        },
        "verified_findings": [serialize_finding(f) for f in verified],
        "review_findings": [serialize_finding(f) for f in needs_review],
        "contradicted_findings": [serialize_finding(f) for f in contradicted],
        "all_findings": [serialize_finding(f) for f in findings]
    }

@router.get("/{review_id}/student")
def get_student_report(review_id: int, db: Session = Depends(get_db)):
    """Student-facing simplified report."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    findings = db.query(Finding).filter(
        Finding.review_id == review_id,
        Finding.authority.in_(["AUTOMATIC", "QUALIFIED_AI"]),
        Finding.status.in_(["VERIFIED", "APPROVED"])
    ).all()
    
    return {
        "review_id": review_id,
        "title": "AcademicReview AI - Correction Report",
        "summary": "Please address the following issues before final submission.",
        "items": [
            {
                "issue": f.claim,
                "category": f.category,
                "severity": f.severity,
                "location": f.location,
                "how_to_fix": f.recommendation
            }
            for f in findings
        ]
    }
