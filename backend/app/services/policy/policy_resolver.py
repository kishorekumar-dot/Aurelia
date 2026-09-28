from typing import List, Dict, Any

def resolve_policies(policies: List[Dict[str, Any]], hierarchy: List[str] = None) -> List[Dict[str, Any]]:
    """
    Resolves conflicting policies based on hierarchy.
    Example hierarchy: ["LECTURER", "DEPARTMENT", "INSTITUTION"]
    Lower index means higher priority.
    """
    if hierarchy is None:
        hierarchy = ["LECTURER", "TEMPLATE", "COURSE", "PROGRAM", "DEPARTMENT", "INSTITUTION"]
        
    # Group policies by requirement
    requirement_groups = {}
    for p in policies:
        if p.get("status") != "ACTIVE":
            continue
        req_key = f"{p.get('target')}_{p.get('requirement')}"
        if req_key not in requirement_groups:
            requirement_groups[req_key] = []
        requirement_groups[req_key].append(p)
        
    resolved = []
    
    for req_key, group in requirement_groups.items():
        if len(group) == 1:
            resolved.append(group[0])
            continue
            
        # Conflict resolution
        # Sort by hierarchy index
        def get_priority(policy):
            source = policy.get("source", "UNKNOWN")
            if source in hierarchy:
                return hierarchy.index(source)
            return len(hierarchy)
            
        sorted_group = sorted(group, key=get_priority)
        winner = sorted_group[0]
        
        # We can add metadata about the conflict resolution
        winner["conflict_resolution"] = {
            "competing_policies": [p.get("policy_id") for p in sorted_group[1:]],
            "reason": f"Source '{winner.get('source')}' has higher priority."
        }
        resolved.append(winner)
        
    return resolved
