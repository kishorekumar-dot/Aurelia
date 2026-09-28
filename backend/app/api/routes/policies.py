from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Policy
from app.services.policy.policy_parser import parse_policy, detect_ambiguity
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class PolicyRequest(BaseModel):
    natural_rule: str
    review_id: Optional[int] = None
    source: str = "LECTURER"

class PolicyConfirmRequest(BaseModel):
    status: str  # "ACTIVE" or "REJECTED"

@router.post("/parse")
def parse_policy_rule(req: PolicyRequest, db: Session = Depends(get_db)):
    """
    Parse a natural language rule into a structured policy.
    Returns AMBIGUOUS status if ambiguous terms found.
    """
    ambiguities = detect_ambiguity(req.natural_rule)
    if ambiguities:
        return {
            "status": "AMBIGUOUS",
            "ambiguous_terms": ambiguities,
            "clarification_needed": f"Please clarify what you mean by: {', '.join(ambiguities)}",
            "original_rule": req.natural_rule
        }
    
    parsed = parse_policy(req.natural_rule)
    
    if parsed.get("status") in ["AMBIGUOUS", "UNSUPPORTED"]:
        return parsed
    
    # Persist active policy
    db_policy = Policy(
        review_id=req.review_id,
        target=parsed.get("target"),
        requirement=parsed.get("requirement"),
        constraints=parsed.get("constraints"),
        obligation=parsed.get("obligation", "MANDATORY"),
        source=req.source,
        status="ACTIVE"
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    
    return {
        "policy_db_id": db_policy.id,
        **parsed
    }

@router.get("/")
def list_policies(review_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Policy)
    if review_id is not None:
        query = query.filter(Policy.review_id == review_id)
    policies = query.all()
    return [
        {
            "id": p.id,
            "review_id": p.review_id,
            "target": p.target,
            "requirement": p.requirement,
            "constraints": p.constraints,
            "obligation": p.obligation,
            "source": p.source,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in policies
    ]

@router.post("/{policy_id}/confirm")
def confirm_policy(policy_id: int, req: PolicyConfirmRequest, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.status = req.status
    db.commit()
    return {"id": policy.id, "status": policy.status}

@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    db.commit()
    return {"message": "Policy deleted"}
