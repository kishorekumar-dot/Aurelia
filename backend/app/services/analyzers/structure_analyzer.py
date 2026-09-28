from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def analyze_structure(document: DocumentModel, required_sections: List[str] = None) -> List[Dict[str, Any]]:
    """
    Analyzes document structure for required sections.
    """
    if required_sections is None:
        required_sections = [
            "Abstract", "Introduction", "Methodology", "Results", "Conclusion", "References"
        ]
        
    findings = []
    
    # Extract all headings
    headings = [el.text.strip().lower() for el in document.elements if el.type == "heading" and el.text]
    
    for req in required_sections:
        found = False
        for heading in headings:
            if req.lower() in heading:
                found = True
                break
                
        if not found:
            findings.append({
                "claim": f"Required section '{req}' appears to be missing.",
                "category": "CONTENT_COMPLETENESS",
                "severity": "MAJOR",
                "location": None,
                "policy_id": "STRUCT-001",
                "status": "VERIFIED",
                "authority": "AUTOMATIC",
                "recommendation": f"Ensure a heading for '{req}' is present in the document."
            })
            
    return findings
