"""
Claim Classification Module
Categorizes findings into distinct claim types according to academic verification rigor.
"""

from enum import Enum
from typing import Dict, Any


class ClaimType(str, Enum):
    FORMAT = "CLAIM_TYPE_FORMAT"
    STRUCTURE = "CLAIM_TYPE_STRUCTURE"
    CONTENT = "CLAIM_TYPE_CONTENT"
    REFERENCE = "CLAIM_TYPE_REFERENCE"
    CONSISTENCY = "CLAIM_TYPE_CONSISTENCY"
    FACT = "CLAIM_TYPE_FACT"
    CONTRIBUTION = "CLAIM_TYPE_CONTRIBUTION"
    ORIGINALITY = "CLAIM_TYPE_ORIGINALITY"
    ACADEMIC_QUALITY = "CLAIM_TYPE_ACADEMIC_QUALITY"


def classify_claim_type(finding: Dict[str, Any]) -> str:
    """
    Classifies a finding into one of the canonical claim types.
    """
    category = str(finding.get("category", "")).upper()
    agent = str(finding.get("agent", "")).lower()
    claim_text = str(finding.get("claim", "")).lower()

    if "FORMAT" in category or agent == "format":
        if "section" in claim_text or "structure" in claim_text or "heading" in claim_text:
            return ClaimType.STRUCTURE.value
        return ClaimType.FORMAT.value

    if "STRUCTURE" in category or agent == "structure":
        return ClaimType.STRUCTURE.value

    if "REFERENCE" in category or "CITATION" in category or agent == "reference":
        return ClaimType.REFERENCE.value

    if "CONSISTENCY" in category or agent == "consistency":
        return ClaimType.CONSISTENCY.value

    if "FACT" in category or "INTEGRITY" in category or agent == "integrity":
        return ClaimType.FACT.value

    if "INNOVATION" in category or agent == "innovation" or "contribution" in claim_text:
        if "novel" in claim_text or "original" in claim_text:
            return ClaimType.ORIGINALITY.value
        return ClaimType.CONTRIBUTION.value

    if "CONTENT" in category or agent == "content":
        return ClaimType.CONTENT.value

    return ClaimType.ACADEMIC_QUALITY.value
