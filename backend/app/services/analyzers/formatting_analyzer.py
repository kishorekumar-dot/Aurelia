from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def analyze_formatting(document: DocumentModel, required_font: str = "Times New Roman", required_size_pt: int = 12) -> List[Dict[str, Any]]:
    findings = []
    
    for el in document.elements:
        if el.type == "paragraph":
            font = el.metadata.get("font_name")
            size = el.metadata.get("font_size_pt")
            
            # If properties are explicitly set and don't match
            if font and required_font.lower() not in font.lower():
                findings.append({
                    "claim": f"Paragraph uses incorrect font '{font}'. Expected '{required_font}'.",
                    "category": "FORMATTING",
                    "severity": "MINOR",
                    "location": {"element_id": el.element_id, "section": el.section},
                    "policy_id": "FMT-001",
                    "status": "VERIFIED",
                    "authority": "AUTOMATIC",
                    "recommendation": f"Change font to '{required_font}'."
                })
                
            if size and size != required_size_pt:
                findings.append({
                    "claim": f"Paragraph uses incorrect font size {size}pt. Expected {required_size_pt}pt.",
                    "category": "FORMATTING",
                    "severity": "MINOR",
                    "location": {"element_id": el.element_id, "section": el.section},
                    "policy_id": "FMT-002",
                    "status": "VERIFIED",
                    "authority": "AUTOMATIC",
                    "recommendation": f"Change font size to {required_size_pt}pt."
                })
                
    return findings
