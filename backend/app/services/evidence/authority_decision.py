"""
Authority Decision Module
Maps claim types, evidence sufficiency, and academic risk to 3 authority tiers:
LEVEL 3 — AUTOMATIC
LEVEL 2 — QUALIFIED AI
LEVEL 1 — LECTURER REVIEW
"""

from enum import Enum
from typing import Dict, Any
from app.services.evidence.claim_classifier import ClaimType


class AuthorityLevel(str, Enum):
    LEVEL_3_AUTOMATIC = "AUTOMATIC"
    LEVEL_2_QUALIFIED_AI = "QUALIFIED_AI"
    LEVEL_1_LECTURER_REVIEW = "LECTURER_REVIEW"


def determine_authority_level(
    claim_type: str,
    status: str,
    confidence: float = 1.0,
    requires_expert_judgment: bool = False,
) -> str:
    """
    Computes authority tier based on claim type and academic risk.
    """
    # Any claim requiring academic expertise or evaluating novelty/contribution is ALWAYS LEVEL 1
    if (
        requires_expert_judgment
        or claim_type in (ClaimType.ORIGINALITY.value, ClaimType.CONTRIBUTION.value, ClaimType.ACADEMIC_QUALITY.value)
    ):
        return AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value

    # If evidence is insufficient or contradicted, escalate to lecturer
    if status in ("INSUFFICIENT", "CONTRADICTED"):
        return AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value

    # LEVEL 3: Deterministic checks (formatting, structure, reference count, captioning)
    if claim_type in (ClaimType.FORMAT.value, ClaimType.STRUCTURE.value):
        if confidence >= 0.90:
            return AuthorityLevel.LEVEL_3_AUTOMATIC.value
        return AuthorityLevel.LEVEL_2_QUALIFIED_AI.value

    # LEVEL 2: Semantic evaluations with strong evidence (content completeness, consistency, fact with source)
    if claim_type in (ClaimType.CONTENT.value, ClaimType.CONSISTENCY.value, ClaimType.REFERENCE.value, ClaimType.FACT.value):
        if confidence >= 0.75:
            return AuthorityLevel.LEVEL_2_QUALIFIED_AI.value
        return AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value

    # Default to lecturer oversight
    return AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value
