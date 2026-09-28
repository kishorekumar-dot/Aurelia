import uuid
from typing import Dict, Any

def build_evidence(finding: Dict[str, Any], document_name: str, observation: str, value: Any, method: str, confidence: float = 1.0) -> Dict[str, Any]:
    """
    Converts an observation into structured evidence.
    """
    return {
        "evidence_id": f"E-{uuid.uuid4().hex[:8]}",
        "source": document_name,
        "location": finding.get("location"),
        "observation": observation,
        "value": value,
        "method": method,
        "confidence": confidence
    }

def detect_contradictions(evidence_list: list[Dict[str, Any]]) -> bool:
    """
    Simple contradiction detection logic.
    For example, if one evidence says a feature exists and another says it doesn't.
    """
    values = [e.get("value") for e in evidence_list]
    if True in values and False in values:
        return True
    return False
