from typing import Dict, Any, List

def detect_ambiguity(natural_rule: str) -> List[str]:
    ambiguous_words = ["recent", "proper", "good", "sufficient", "appropriate"]
    found = []
    rule_lower = natural_rule.lower()
    for word in ambiguous_words:
        if word in rule_lower:
            found.append(word)
    return found

def parse_policy(natural_rule: str) -> Dict[str, Any]:
    """
    Mock parser for MVP. In reality, this would use an LLM.
    """
    ambiguities = detect_ambiguity(natural_rule)
    if ambiguities:
        return {
            "status": "AMBIGUOUS",
            "reason": f"Contains ambiguous terms: {', '.join(ambiguities)}",
            "original_rule": natural_rule
        }
        
    # Mocking standard rules for testing based on prompt
    rule_lower = natural_rule.lower()
    
    if "figure" in rule_lower and "caption" in rule_lower:
        return {
            "policy_id": "FIG-001",
            "target": "FIGURE",
            "requirement": "CAPTION",
            "constraints": {"exists": True},
            "obligation": "MANDATORY",
            "status": "ACTIVE",
            "original_rule": natural_rule
        }
    
    if "times new roman" in rule_lower:
        return {
            "policy_id": "FMT-001",
            "target": "PARAGRAPH",
            "requirement": "FONT",
            "constraints": {"font_name": "Times New Roman"},
            "obligation": "MANDATORY",
            "status": "ACTIVE",
            "original_rule": natural_rule
        }
        
    if "references" in rule_lower and "least" in rule_lower:
        # crude extraction
        import re
        nums = re.findall(r'\d+', natural_rule)
        min_ref = int(nums[0]) if nums else 5
        return {
            "policy_id": "REF-002",
            "target": "DOCUMENT",
            "requirement": "MIN_REFERENCES",
            "constraints": {"min_count": min_ref},
            "obligation": "MANDATORY",
            "status": "ACTIVE",
            "original_rule": natural_rule
        }
        
    return {
        "status": "UNSUPPORTED",
        "reason": "Could not parse rule deterministically (mock behavior)",
        "original_rule": natural_rule
    }
