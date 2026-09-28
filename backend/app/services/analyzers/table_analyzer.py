from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def analyze_tables(document: DocumentModel) -> List[Dict[str, Any]]:
    findings = []
    elements = document.elements
    for idx, el in enumerate(elements):
        if el.type == "table":
            has_caption = False
            # Look at previous element
            if idx > 0 and elements[idx-1].type == "caption":
                has_caption = True
            
            if not has_caption:
                findings.append({
                    "claim": f"Table '{el.element_id}' does not have a caption.",
                    "category": "TABLE_COMPLIANCE",
                    "severity": "MAJOR",
                    "location": {"element_id": el.element_id, "section": el.section},
                    "policy_id": "TBL-001",
                    "status": "VERIFIED",
                    "authority": "AUTOMATIC",
                    "recommendation": "Add a numbered caption above the table."
                })
    return findings
