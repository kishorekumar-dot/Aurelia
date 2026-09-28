import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database.database import get_db
from app.database.models import Rule, PolicySnapshot, User

router = APIRouter()

class PolicySnapshotResponse(BaseModel):
    id: int
    name: str
    scoring_weights: Dict[str, float]
    required_sections: List[str]
    checklists: List[str]
    format_rules: Dict[str, Any]

class RuleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    version: str
    raw_text: Optional[str]
    created_at: str
    active_policy: Optional[PolicySnapshotResponse]

class RuleCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    raw_text: Optional[str] = ""
    scoring_weights: Optional[Dict[str, float]] = None
    required_sections: Optional[List[str]] = None

@router.get("", response_model=List[RuleResponse])
def get_rules(db: Session = Depends(get_db)):
    rules = db.query(Rule).all()
    res = []
    for r in rules:
        snap = db.query(PolicySnapshot).filter(PolicySnapshot.rule_id == r.id).first()
        snap_resp = None
        if snap:
            snap_resp = PolicySnapshotResponse(
                id=snap.id,
                name=snap.name,
                scoring_weights=snap.scoring_weights or {"format": 0.2, "content": 0.4, "innovation": 0.25, "consistency": 0.15},
                required_sections=snap.required_sections or ["Abstract", "Introduction", "Methodology", "Conclusion", "References"],
                checklists=snap.checklists or [],
                format_rules=snap.format_rules or {}
            )
        res.append(RuleResponse(
            id=r.id,
            title=r.title,
            description=r.description,
            version=r.version,
            raw_text=r.raw_text,
            created_at=r.created_at.isoformat(),
            active_policy=snap_resp
        ))
    return res

@router.post("", response_model=RuleResponse)
async def create_rule(
    title: str = Form(...),
    description: Optional[str] = Form(""),
    raw_text: Optional[str] = Form(""),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    lecturer = db.query(User).first()
    lecturer_id = lecturer.id if lecturer else 1

    file_path = None
    extracted_text = raw_text or ""

    if file:
        os.makedirs("uploads/rules", exist_ok=True)
        file_path = f"uploads/rules/{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Read plain text or doc string from uploaded file if empty
        if not extracted_text:
            extracted_text = f"Uploaded evaluation rule document: {file.filename}\nRequirements: Must include Abstract, Methodology, Results, and References."

    rule = Rule(
        author_id=lecturer_id,
        title=title,
        description=description,
        file_path=file_path,
        raw_text=extracted_text,
        version="1.0"
    )
    db.add(rule)
    db.flush()

    # Automatically generate Adaptive Policy Snapshot from rules
    req_sections = ["Abstract", "Introduction", "Methodology", "Evaluation", "Conclusion", "References"]
    if "ieee" in title.lower() or "capstone" in title.lower():
        req_sections = ["Abstract", "Problem Statement", "Architecture", "Test Matrix", "References"]

    snapshot = PolicySnapshot(
        rule_id=rule.id,
        name=f"Adaptive Policy ({title})",
        agent_prompts={
            "format": f"Evaluate document layout against {title} guidelines.",
            "content": f"Assess mathematical and technical rigor as dictated by {title}.",
            "innovation": "Verify explicit novelty statements and comparisons to baseline work.",
            "consistency": "Check internal reference, equation, and figure numbering."
        },
        checklists=[
            "Document must contain all mandatory structural sections.",
            "Methodology must present clear experimental protocol.",
            "References must be properly cited with complete metadata."
        ],
        scoring_weights={"format": 0.20, "content": 0.40, "innovation": 0.25, "consistency": 0.15},
        required_sections=req_sections,
        format_rules={"min_pages": 4, "max_pages": 30, "require_citations": True}
    )
    db.add(snapshot)
    db.commit()

    return RuleResponse(
        id=rule.id,
        title=rule.title,
        description=rule.description,
        version=rule.version,
        raw_text=rule.raw_text,
        created_at=rule.created_at.isoformat(),
        active_policy=PolicySnapshotResponse(
            id=snapshot.id,
            name=snapshot.name,
            scoring_weights=snapshot.scoring_weights,
            required_sections=snapshot.required_sections,
            checklists=snapshot.checklists,
            format_rules=snapshot.format_rules
        )
    )

@router.get("/{rule_id}", response_model=RuleResponse)
def get_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    snap = db.query(PolicySnapshot).filter(PolicySnapshot.rule_id == rule.id).first()
    snap_resp = None
    if snap:
        snap_resp = PolicySnapshotResponse(
            id=snap.id,
            name=snap.name,
            scoring_weights=snap.scoring_weights or {"format": 0.2, "content": 0.4, "innovation": 0.25, "consistency": 0.15},
            required_sections=snap.required_sections or ["Abstract", "Introduction", "Methodology", "Conclusion", "References"],
            checklists=snap.checklists or [],
            format_rules=snap.format_rules or {}
        )
    return RuleResponse(
        id=rule.id,
        title=rule.title,
        description=rule.description,
        version=rule.version,
        raw_text=rule.raw_text,
        created_at=rule.created_at.isoformat(),
        active_policy=snap_resp
    )
