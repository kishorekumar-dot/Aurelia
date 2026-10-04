from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Finding, Evidence, LecturerFeedback, User
from app.api.deps import get_current_user, get_current_lecturer
from app.core.sanitizer import sanitize_text
from typing import Optional
from pydantic import BaseModel, Field

router = APIRouter()

class FeedbackRequest(BaseModel):
    action: str
    comment: Optional[str] = Field(None, max_length=2000)

class ModifyRequest(BaseModel):
    severity: Optional[str] = None
    recommendation: Optional[str] = Field(None, max_length=2000)
    comment: Optional[str] = Field(None, max_length=2000)

ALLOWED_SEVERITIES = {"CRITICAL", "MAJOR", "MINOR", "INFO"}

@router.get("/{finding_id}")
def get_finding(
    finding_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
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
def approve_finding(
    finding_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    finding.status = "APPROVED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=current_user.id,
        action="APPROVE",
        comment=sanitize_text(req.comment or "", max_length=2000) or None
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "APPROVED"}

@router.post("/{finding_id}/reject")
def reject_finding(
    finding_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    finding.status = "REJECTED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=current_user.id,
        action="REJECT",
        comment=sanitize_text(req.comment or "", max_length=2000) or None
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "REJECTED"}

@router.post("/{finding_id}/modify")
def modify_finding(
    finding_id: int,
    req: ModifyRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")

    if req.severity:
        clean_sev = req.severity.upper().strip()
        if clean_sev not in ALLOWED_SEVERITIES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid severity. Must be one of: {', '.join(ALLOWED_SEVERITIES)}"
            )
        finding.severity = clean_sev

    if req.recommendation:
        finding.recommendation = sanitize_text(req.recommendation, max_length=2000)

    finding.status = "MODIFIED"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=current_user.id,
        action="MODIFY",
        comment=sanitize_text(req.comment or "", max_length=2000) or None
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "MODIFIED", "severity": finding.severity}


@router.post("/{finding_id}/false_positive")
def mark_false_positive(
    finding_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    finding.status = "FALSE_POSITIVE"
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=current_user.id,
        action="FALSE_POSITIVE",
        comment=sanitize_text(req.comment or "", max_length=2000) or "Marked as false positive by lecturer"
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "status": "FALSE_POSITIVE"}


@router.post("/{finding_id}/comment")
def add_finding_comment(
    finding_id: int,
    req: FeedbackRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finding not found")
    feedback = LecturerFeedback(
        finding_id=finding_id,
        reviewer_id=current_user.id,
        action="COMMENT",
        comment=sanitize_text(req.comment or "", max_length=2000) or None
    )
    db.add(feedback)
    db.commit()
    return {"finding_id": finding_id, "message": "Comment recorded"}

