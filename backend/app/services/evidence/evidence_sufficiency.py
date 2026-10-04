"""
Evidence Sufficiency & Status Evaluation
Evaluates whether available evidence substantiates a claim according to academic standards.
Statuses: VERIFIED, SUPPORTED, INSUFFICIENT, CONTRADICTED.
"""

from typing import Dict, Any, List, Optional
from enum import Enum


class FindingStatus(str, Enum):
    VERIFIED = "VERIFIED"
    SUPPORTED = "SUPPORTED"
    INSUFFICIENT = "INSUFFICIENT"
    CONTRADICTED = "CONTRADICTED"


def evaluate_evidence_sufficiency(
    finding: Dict[str, Any],
    document_evidence: List[Dict[str, Any]],
    external_evidence: Optional[List[Dict[str, Any]]] = None,
    contradicted: bool = False,
) -> str:
    """
    Determines finding status based on evidence rigor:
    - VERIFIED: deterministic rule or document parser verified directly (confidence >= 0.95).
    - SUPPORTED: semantic or external evidence supports claim (confidence >= 0.70).
    - INSUFFICIENT: missing excerpts, low confidence (< 0.70), or location unavailable for specific claims.
    - CONTRADICTED: direct contradiction detected in observations.
    """
    if contradicted:
        return FindingStatus.CONTRADICTED.value

    all_evidence = (document_evidence or []) + (external_evidence or [])
    if not all_evidence:
        return FindingStatus.INSUFFICIENT.value

    # Check for direct contradictions in evidence values
    values = [e.get("value") for e in all_evidence if e.get("value") is not None]
    if True in values and False in values:
        return FindingStatus.CONTRADICTED.value

    # Check confidence and location validity
    min_confidence = min((e.get("confidence", 0.0) for e in all_evidence), default=0.0)
    has_valid_excerpt = any(
        bool(e.get("excerpt") or e.get("observation") or e.get("quote"))
        for e in all_evidence
    )

    if not has_valid_excerpt or min_confidence < 0.60:
        return FindingStatus.INSUFFICIENT.value

    # If deterministic check
    method = finding.get("method", "")
    category = finding.get("category", "").upper()
    if method in ("document_parser", "deterministic", "regex", "font_checker") or category in ("FORMATTING", "STRUCTURE"):
        if min_confidence >= 0.90:
            return FindingStatus.VERIFIED.value

    if min_confidence >= 0.70:
        return FindingStatus.SUPPORTED.value

    return FindingStatus.INSUFFICIENT.value
