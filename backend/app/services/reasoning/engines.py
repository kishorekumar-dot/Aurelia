from typing import Dict, Any

def classify_claim(finding: Dict[str, Any]) -> str:
    category = finding.get("category", "")
    if "FORMATTING" in category or "COMPLIANCE" in category:
        return "STRUCTURAL"
    if "CONTENT" in category:
        return "CONTENT_COMPLETENESS"
    if "INNOVATION" in category:
        return "INNOVATION"
    return "UNKNOWN"

def check_evidence_sufficiency(finding: Dict[str, Any], evidence_list: list[Dict[str, Any]]) -> str:
    # Deterministic evidence sufficiency logic
    if not evidence_list:
        return "INSUFFICIENT"
        
    for ev in evidence_list:
        if ev.get("confidence", 0) < 0.8:
            return "INSUFFICIENT"
            
    return "SUFFICIENT"

def determine_authority(finding: Dict[str, Any], claim_class: str, sufficiency: str, contradicted: bool) -> str:
    if claim_class == "STRUCTURAL":
        return "AUTOMATIC"  # LEVEL 3
    if claim_class == "CONTENT_COMPLETENESS":
        return "QUALIFIED_AI"  # LEVEL 2
    return "LECTURER"  # LEVEL 1

def route_decision(finding: Dict[str, Any], authority: str, sufficiency: str, contradicted: bool) -> str:
    if contradicted:
        return "REJECT_OR_REANALYZE"
    if sufficiency == "INSUFFICIENT":
        return "LECTURER_REVIEW"
    if authority == "LECTURER":
        return "LECTURER_REVIEW"
    if authority == "AUTOMATIC":
        return "AUTOMATIC_RECOMMENDATION"
    if authority == "QUALIFIED_AI":
        return "QUALIFIED_RECOMMENDATION"
    return "LECTURER_REVIEW"
