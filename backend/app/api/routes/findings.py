from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Finding, Evidence, LecturerFeedback
from typing import Optional
from pydantic import BaseModel

router = APIRouter()

class FeedbackRequest(BaseModel):
    action: str  # APPROVE, REJECT, MODIFY
    comment: Optional[str] = None
    reviewer_id: Optional[int] = None

class ModifyRequest(BaseModel):
    severity: Optional[str] = None
    recommendation: Optional[str] = None
    comment: Optional[str] = None
    reviewer_id: Optional[int] = None

@router.get("/{finding_id}")
def get_finding(finding_id: int, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    evidence = db.query(Evidence).filter(Evidence.finding_id == finding_id).all()
    return {
        "id": finding.id,
        "review_id": finding.review_id,
        "claim": finding.claim,
        "category": finding.category,
        "severity": finding.severity,
        "location": finding.location,
        "status": finding.status,
        "authority": finding.authority,
        "recommendation": finding.recommendation,
        "policy_id": finding.policy_id,
        "evidence": [
            {
                "id": e.id,
                "observation": e.observation,
                "value": e.value,
                "method": e.method,
                "confidence": e.confidence,
                "location": e.location,
                "source": e.source
            }
            for e in evidence
        ]
    }

@router.post("/{finding_id}/approve")
def approve_finding(finding_id: int, req: FeedbackRequest, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    finding.status = "APPROVED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=req.reviewer_id or 1,
        action="APPROVE",
        comment=req.comment
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "APPROVED"}

@router.post("/{finding_id}/reject")
def reject_finding(finding_id: int, req: FeedbackRequest, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    finding.status = "REJECTED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=req.reviewer_id or 1,
        action="REJECT",
        comment=req.comment
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "REJECTED"}

@router.post("/{finding_id}/modify")
def modify_finding(finding_id: int, req: ModifyRequest, db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if req.severity:
        finding.severity = req.severity
    if req.recommendation:
        finding.recommendation = req.recommendation
    finding.status = "MODIFIED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=req.reviewer_id or 1,
        action="MODIFY",
        comment=req.comment
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "MODIFIED", "severity": finding.severity}
