from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Review, Finding, Evidence, User
from app.api.deps import get_current_user, get_current_lecturer

router = APIRouter()

@router.get("/{review_id}")
def get_report(
    review_id: int,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    """
    Build and return the full lecturer report from persisted DB data.
    Only accessible to faculty supervisors.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

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
def get_student_report(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Student-facing simplified report — only shows published/approved findings.
    """
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    # Students can only access published reviews
    if not review.is_published:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This feedback has not been published yet. Please wait for your supervisor."
        )

    findings = db.query(Finding).filter(
        Finding.review_id == review_id,
        Finding.authority.in_(["AUTOMATIC", "QUALIFIED_AI"]),
        Finding.status.in_(["VERIFIED", "APPROVED", "PUBLISHED"])
    ).all()

    return {
        "review_id": review_id,
        "title": "AURELIA — Academic Review Feedback",
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
