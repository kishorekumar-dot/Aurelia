import os
import uuid
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database.database import get_db
from app.database.models import Rule, PolicySnapshot, User
from app.api.deps import get_current_user, get_current_lecturer
from app.core.config import settings
from app.core.sanitizer import validate_uploaded_file, sanitize_text

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

@router.get("", response_model=List[RuleResponse])
def get_rules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    current_user: User = Depends(get_current_lecturer),
    db: Session = Depends(get_db)
):
    clean_title = sanitize_text(title, max_length=200)
    clean_desc = sanitize_text(description or "", max_length=1000)
    clean_text = sanitize_text(raw_text or "", max_length=10000)

    file_path = None
    if file:
        safe_filename = validate_uploaded_file(file)
        rules_upload_dir = settings.UPLOAD_DIR / "rules"
        rules_upload_dir.mkdir(parents=True, exist_ok=True)
        stored_file_path = rules_upload_dir / f"{uuid.uuid4().hex}_{safe_filename}"

        with open(stored_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        file_path = str(stored_file_path)

        if not clean_text:
            clean_text = f"Uploaded evaluation rubric: {safe_filename}\nRequirements: Must include Abstract, Methodology, Results, and References."

    rule = Rule(
        author_id=current_user.id,
        title=clean_title,
        description=clean_desc,
        file_path=file_path,
        raw_text=clean_text,
        version="1.0"
    )
    db.add(rule)
    db.flush()

    req_sections = ["Abstract", "Introduction", "Methodology", "Evaluation", "Conclusion", "References"]
    if "ieee" in clean_title.lower() or "capstone" in clean_title.lower():
        req_sections = ["Abstract", "Problem Statement", "Architecture", "Test Matrix", "References"]

    snapshot = PolicySnapshot(
        rule_id=rule.id,
        name=f"Adaptive Policy ({clean_title})",
        agent_prompts={
            "format": f"Evaluate document layout against {clean_title} guidelines.",
            "content": f"Assess mathematical and technical rigor as dictated by {clean_title}.",
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
def get_rule(
    rule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rule not found")

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
