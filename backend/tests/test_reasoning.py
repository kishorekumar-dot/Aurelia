import pytest
from app.services.reasoning.engines import classify_claim, check_evidence_sufficiency, determine_authority, route_decision

def test_engines():
    finding = {"category": "FIGURE_COMPLIANCE"}
    claim = classify_claim(finding)
    assert claim == "STRUCTURAL"
    
    evidence = [{"confidence": 0.9}]
    suff = check_evidence_sufficiency(finding, evidence)
    assert suff == "SUFFICIENT"
    
    auth = determine_authority(finding, claim, suff, False)
    assert auth == "AUTOMATIC"
    
    decision = route_decision(finding, auth, suff, False)
    assert decision == "AUTOMATIC_RECOMMENDATION"
