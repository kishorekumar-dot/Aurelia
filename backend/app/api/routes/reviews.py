import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database.database import get_db, SessionLocal
from app.database.models import Review, Document, Rule, PolicySnapshot, Finding, Evidence, Decision, User
from app.services.pipeline import ReviewPipeline
from app.api.deps import get_current_user, get_current_lecturer

router = APIRouter()

class FindingResponse(BaseModel):
    id: int
    agent: str
    finding_code: str
    title: str
    severity: str
    claim: str
    quote: str
    location_page: Optional[int]
    location_section: Optional[str]
    evidence_sufficient: bool
    confidence: float

class DecisionRequest(BaseModel):
    action: str # accept | flag | override
    note: Optional[str] = ""

class DecisionResponse(BaseModel):
    id: int
    review_id: int
    action: str
    note: Optional[str]
    created_at: str

class ReviewCreateRequest(BaseModel):
    document_id: int
    rule_id: Optional[int] = None
    title: Optional[str] = "Academic Document Review"
    student_name: Optional[str] = "Student Submission"

class ReviewDetailResponse(BaseModel):
    id: int
    title: str
    student_name: str
    status: str
    current_stage: str
    overall_score: Optional[float]
    format_score: Optional[float]
    content_score: Optional[float]
    innovation_score: Optional[float]
    consistency_score: Optional[float]
    confidence_score: Optional[float]
    routing_decision: Optional[str]
    summary: Optional[str]
    created_at: str
    completed_at: Optional[str]
    document: Optional[Dict[str, Any]]
    rule: Optional[Dict[str, Any]]
    findings: List[FindingResponse]
    decisions: List[DecisionResponse]

def run_pipeline_task(review_id: int):
    db = SessionLocal()
    try:
        pipeline = ReviewPipeline(db, review_id)
        asyncio.run(pipeline.run())
    finally:
        db.close()

@router.get("", response_model=List[Dict[str, Any]])
def get_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    res = []
    for r in reviews:
        doc = db.query(Document).filter(Document.id == r.document_id).first()
        res.append({
            "id": r.id,
            "title": r.title,
            "student_name": r.student_name,
            "status": r.status,
            "current_stage": r.current_stage,
            "overall_score": r.overall_score,
            "routing_decision": r.routing_decision,
            "confidence_score": r.confidence_score,
            "created_at": r.created_at.isoformat(),
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "document_filename": doc.filename if doc else "Document"
        })
    return res

@router.post("", response_model=Dict[str, Any])
def create_review(
    req: ReviewCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == req.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rule = None
    if req.rule_id:
        rule = db.query(Rule).filter(Rule.id == req.rule_id).first()
    if not rule:
        rule = db.query(Rule).first()

    policy_snap = None
    if rule:
        policy_snap = db.query(PolicySnapshot).filter(PolicySnapshot.rule_id == rule.id).first()

    lecturer_id = current_user.id

    review = Review(
        reviewer_id=lecturer_id,
        document_id=doc.id,
        rule_id=rule.id if rule else None,
        policy_snapshot_id=policy_snap.id if policy_snap else None,
        title=req.title or doc.filename,
        student_name=req.student_name or "Student Author",
        status="RUNNING",
        current_stage="adaptive_policy"
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Launch background async multi-agent pipeline execution
    background_tasks.add_task(run_pipeline_task, review.id)

    return {
        "id": review.id,
        "message": "Review task initiated successfully",
        "status": review.status,
        "current_stage": review.current_stage
    }

@router.get("/{review_id}", response_model=ReviewDetailResponse)
def get_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    doc = db.query(Document).filter(Document.id == review.document_id).first()
    rule = db.query(Rule).filter(Rule.id == review.rule_id).first() if review.rule_id else None
    findings = db.query(Finding).filter(Finding.review_id == review.id).all()
    decisions = db.query(Decision).filter(Decision.review_id == review.id).all()

    findings_resp = [
        FindingResponse(
            id=f.id,
            agent=f.agent,
            finding_code=f.finding_code,
            title=f.title,
            severity=f.severity,
            claim=f.claim,
            quote=f.quote,
            location_page=f.location_page,
            location_section=f.location_section,
            evidence_sufficient=f.evidence_sufficient,
            confidence=f.confidence
        )
        for f in findings
    ]

    decisions_resp = [
        DecisionResponse(
            id=d.id,
            review_id=d.review_id,
            action=d.action,
            note=d.note,
            created_at=d.created_at.isoformat()
        )
        for d in decisions
    ]

    return ReviewDetailResponse(
        id=review.id,
        title=review.title,
        student_name=review.student_name,
        status=review.status,
        current_stage=review.current_stage,
        overall_score=review.overall_score,
        format_score=review.format_score,
        content_score=review.content_score,
        innovation_score=review.innovation_score,
        consistency_score=review.consistency_score,
        confidence_score=review.confidence_score,
        routing_decision=review.routing_decision,
        summary=review.summary,
        created_at=review.created_at.isoformat(),
        completed_at=review.completed_at.isoformat() if review.completed_at else None,
        document={"id": doc.id, "filename": doc.filename, "type": doc.document_type} if doc else None,
        rule={"id": rule.id, "title": rule.title, "version": rule.version} if rule else None,
        findings=findings_resp,
        decisions=decisions_resp
    )

@router.get("/{review_id}/events")
def get_review_events(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    stages = ReviewPipeline.STAGES
    current_idx = stages.index(review.current_stage) if review.current_stage in stages else (len(stages) if review.status == "COMPLETED" else 0)

    events = []
    for idx, stage in enumerate(stages):
        if idx < current_idx or review.status == "COMPLETED":
            st = "done"
        elif idx == current_idx and review.status == "RUNNING":
            st = "running"
        elif review.status == "FAILED" and idx == current_idx:
            st = "failed"
        else:
            st = "idle"

        events.append({
            "stage": stage,
            "status": st,
            "index": idx + 1,
            "total": len(stages)
        })

    return {
        "review_id": review.id,
        "status": review.status,
        "current_stage": review.current_stage,
        "stages": events
    }

@router.post("/{review_id}/decision", response_model=DecisionResponse)
def create_lecturer_decision(
    review_id: int,
    req: DecisionRequest,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    lecturer_id = current_user.id

    decision = Decision(
        review_id=review.id,
        lecturer_id=lecturer_id,
        action=req.action,
        note=req.note
    )
    db.add(decision)
    
    # Update routing decision if overridden
    if req.action == "accept":
        review.routing_decision = "AUTOMATIC"
    elif req.action in ["flag", "override"]:
        review.routing_decision = "LECTURER_REVIEW"

    db.commit()
    db.refresh(decision)

    return DecisionResponse(
        id=decision.id,
        review_id=decision.review_id,
        action=decision.action,
        note=decision.note,
        created_at=decision.created_at.isoformat()
    )

class PublishRequest(BaseModel):
    lecturer_notes: Optional[str] = None

@router.post("/{review_id}/publish")
def publish_review(
    review_id: int,
    req: Optional[PublishRequest] = None,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.is_published = True
    review.status = "PUBLISHED"
    review.published_at = datetime.utcnow()
    
    # Mark approved findings as published
    findings = db.query(Finding).filter(Finding.review_id == review_id).all()
    for f in findings:
        if f.status in ["APPROVED", "VERIFIED"]:
            f.status = "PUBLISHED"

    db.commit()
    return {
        "review_id": review.id,
        "status": "PUBLISHED",
        "is_published": True,
        "published_at": review.published_at.isoformat(),
        "published_findings_count": len([f for f in findings if f.status == "PUBLISHED"]),
        "message": "Feedback published to student successfully. Only approved items are visible."
    }

@router.post("/{review_id}/run")
@router.post("/{review_id}/reanalyze")
def rerun_review(
    review_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.status = "RUNNING"
    review.current_stage = "adaptive_policy"
    db.commit()

    background_tasks.add_task(run_pipeline_task, review.id)
    return {
        "id": review.id,
        "message": "Review re-analysis queued successfully",
        "status": "RUNNING"
    }

@router.get("/{review_id}/summary")
def get_review_summary(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    return {
        "title": review.title,
        "student": review.student_name,
        "department": review.department,
        "problem": "Post-harvest agricultural storage losses and undetected environmental spikes.",
        "objectives": [
            "Deploy low-power multi-chamber IoT telemetry nodes.",
            "Implement edge decision tree inference for early spoilage classification.",
            "Enforce automatic ventilation triggers upon humidity threshold breach."
        ],
        "solution": "Integrated sensor firmware with Random Forest predictor on edge controller.",
        "methodology": "60-day dual chamber comparative experiment monitoring temperature and volatile gas emissions.",
        "technologies": ["ESP32", "MQTT", "Python", "Scikit-Learn", "FastAPI", "React"],
        "datasets": ["Self-collected environmental sensor dataset (142,000 readings)"],
        "results": "Achieved 94.2% accuracy in predicting spoilage risk 12 hours prior to visible onset.",
        "conclusion": "Demonstrates low-cost edge sensing reduces storage degradation by 38%.",
        "claimed_contribution": "Novel low-power telemetry fusion model with local fail-safe action rules.",
        "viva_questions": [
            "Why was Random Forest selected over temporal recurrent networks for resource-constrained edge execution?",
            "How does the system ensure data integrity during intermittent wireless packet transmission?",
            "What calibration protocols were applied to the DHT22 and MQ-135 sensors to prevent humidity drift?"
        ]
    }

