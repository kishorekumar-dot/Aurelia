from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def analyze_references(document: DocumentModel, min_references: int = 5) -> List[Dict[str, Any]]:
    findings = []
    # Count reference elements
    references = [el for el in document.elements if el.type == "reference"]
    ref_count = len(references)
    
    # Alternatively count paragraphs in the references section
    if ref_count == 0:
        for el in document.elements:
            if el.section and "reference" in el.section.lower() and el.type == "paragraph":
                ref_count += 1
                
    if ref_count == 0:
        findings.append({
            "claim": "No references found in the document.",
            "category": "REFERENCE_COMPLIANCE",
            "severity": "CRITICAL",
            "location": None,
            "policy_id": "REF-001",
            "status": "VERIFIED",
            "authority": "AUTOMATIC",
            "recommendation": "Include a references section with cited works."
        })
    elif ref_count < min_references:
        findings.append({
            "claim": f"Insufficient references. Found {ref_count}, expected at least {min_references}.",
            "category": "REFERENCE_COMPLIANCE",
            "severity": "MAJOR",
            "location": None,
            "policy_id": "REF-002",
            "status": "VERIFIED",
            "authority": "AUTOMATIC",
            "recommendation": f"Add more scholarly references. Minimum required is {min_references}."
        })
        
    return findings
