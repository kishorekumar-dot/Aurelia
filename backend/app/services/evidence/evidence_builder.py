"""
Evidence Construction Module
Converts raw observations into verified evidence items and structured findings.
Guarantees NO fabricated page numbers, quotes, or sources.
"""

import uuid
from typing import Dict, Any, List, Optional
from app.services.evidence.claim_classifier import classify_claim_type
from app.services.evidence.evidence_sufficiency import evaluate_evidence_sufficiency
from app.services.evidence.authority_decision import determine_authority_level


def build_evidence(
    finding: Dict[str, Any],
    document_name: str,
    observation: str,
    value: Any,
    method: str,
    confidence: float = 1.0,
    excerpt: Optional[str] = None,
    page: Optional[int] = None,
    section: Optional[str] = None
) -> Dict[str, Any]:
    """
    Converts an observation into structured evidence.
    Uses 'location_unavailable' if exact location cannot be determined.
    """
    loc = finding.get("location")
    if not loc and page is None and section is None:
        loc = "location_unavailable"
    elif loc is None:
        loc = {
            "page": page if page is not None else "location_unavailable",
            "section": section if section is not None else "location_unavailable"
        }

    return {
        "evidence_id": f"E-{uuid.uuid4().hex[:8]}",
        "source": document_name,
        "location": loc,
        "observation": observation,
        "excerpt": excerpt or finding.get("quote"),
        "value": value,
        "method": method,
        "confidence": confidence
    }


def detect_contradictions(evidence_list: List[Dict[str, Any]]) -> bool:
    """
    Contradiction detection across evidence points.
    """
    values = [e.get("value") for e in evidence_list if e.get("value") is not None]
    if True in values and False in values:
        return True
    return False


def build_structured_finding(
    category: str,
    claim: str,
    status: str,
    document_evidence: Optional[Dict[str, Any]] = None,
    applicable_rule: Optional[Dict[str, Any]] = None,
    external_evidence: Optional[List[Dict[str, Any]]] = None,
    reasoning_summary: str = "",
    confidence: float = 1.0,
    authority_level: Optional[str] = None,
    requires_expert_judgment: bool = False,
    finding_id: Optional[str] = None,
    severity: str = "minor",
    recommendation: Optional[str] = None
) -> Dict[str, Any]:
    """
    Constructs the canonical finding schema:
    {
        "finding_id": "...",
        "category": "...",
        "claim": "...",
        "status": "...",
        "document_evidence": { "page": ..., "section": ..., "excerpt": ... },
        "applicable_rule": { "rule_id": ..., "text": ... },
        "external_evidence": [],
        "reasoning_summary": "...",
        "confidence": 0.0,
        "authority_level": "..."
    }
    """
    fid = finding_id or f"F-{uuid.uuid4().hex[:8]}"
    claim_type = classify_claim_type({"category": category, "claim": claim})

    # Ensure document evidence uses 'location_unavailable' if not provided
    doc_ev = document_evidence or {
        "page": "location_unavailable",
        "section": "location_unavailable",
        "excerpt": "location_unavailable"
    }

    rule = applicable_rule or {
        "rule_id": "DEFAULT",
        "text": "Academic standard compliance"
    }

    ext_ev = external_evidence or []

    # If authority_level not explicitly specified, calculate it
    if not authority_level:
        authority_level = determine_authority_level(
            claim_type=claim_type,
            status=status,
            confidence=confidence,
            requires_expert_judgment=requires_expert_judgment
        )

    return {
        "finding_id": fid,
        "category": category,
        "claim_type": claim_type,
        "severity": severity,
        "claim": claim,
        "status": status,
        "document_evidence": doc_ev,
        "applicable_rule": rule,
        "external_evidence": ext_ev,
        "reasoning_summary": reasoning_summary,
        "confidence": round(confidence, 2),
        "authority_level": authority_level,
        "recommendation": recommendation or ""
    }
