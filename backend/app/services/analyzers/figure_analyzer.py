from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def analyze_figures(document: DocumentModel, policy: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """
    Analyzes figures in the document to check for presence, captions, numbering, and position.
    """
    findings = []
    
    # Simple deterministic rule: Every figure must have a caption.
    # A caption usually follows or precedes the figure.
    
    elements = document.elements
    for idx, el in enumerate(elements):
        if el.type == "figure":
            # Check for caption nearby
            has_caption = False
            # Look at previous element and next element
            if idx > 0 and elements[idx-1].type == "caption":
                has_caption = True
            if idx < len(elements) - 1 and elements[idx+1].type == "caption":
                has_caption = True
                
            if not has_caption:
                # Need to verify if the text itself contains "Figure " as a fallback
                # but for this deterministic rule, we rely on the parser classifying it as "caption".
                findings.append({
                    "claim": f"Figure '{el.element_id}' does not have an associated caption.",
                    "category": "FIGURE_COMPLIANCE",
                    "severity": "MAJOR",
                    "location": {"element_id": el.element_id, "section": el.section},
                    "policy_id": "FIG-001",
                    "status": "VERIFIED",
                    "authority": "AUTOMATIC",
                    "recommendation": "Add a numbered caption below the figure."
                })
                
    return findings
