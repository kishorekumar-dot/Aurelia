import pytest
from app.services.policy.policy_parser import parse_policy, detect_ambiguity
from app.services.policy.policy_resolver import resolve_policies

def test_detect_ambiguity():
    assert "recent" in detect_ambiguity("Use recent references")
    assert "good" in detect_ambiguity("Good formatting")
    assert len(detect_ambiguity("Times New Roman 12pt")) == 0

def test_parse_policy_ambiguous():
    result = parse_policy("Use proper fonts")
    assert result["status"] == "AMBIGUOUS"
    assert "proper" in result["reason"]

def test_parse_policy_deterministic():
    result = parse_policy("Every figure must have a numbered caption below it.")
    assert result["status"] == "ACTIVE"
    assert result["target"] == "FIGURE"

def test_resolve_policies():
    policies = [
        {
            "policy_id": "P1",
            "target": "DOCUMENT",
            "requirement": "MIN_REFERENCES",
            "source": "INSTITUTION",
            "status": "ACTIVE"
        },
        {
            "policy_id": "P2",
            "target": "DOCUMENT",
            "requirement": "MIN_REFERENCES",
            "source": "LECTURER",
            "status": "ACTIVE"
        }
    ]
    
    resolved = resolve_policies(policies)
    assert len(resolved) == 1
    assert resolved[0]["policy_id"] == "P2" # LECTURER > INSTITUTION
    assert "conflict_resolution" in resolved[0]
