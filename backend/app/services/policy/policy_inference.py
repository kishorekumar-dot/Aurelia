from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel

def infer_template_policies(template_document: DocumentModel) -> List[Dict[str, Any]]:
    """
    Infers policies from a sample template document.
    """
    inferred_policies = []
    
    # Simple inference: check most common font in paragraphs
    font_counts = {}
    size_counts = {}
    
    for el in template_document.elements:
        if el.type == "paragraph":
            font = el.metadata.get("font_name")
            size = el.metadata.get("font_size_pt")
            if font:
                font_counts[font] = font_counts.get(font, 0) + 1
            if size:
                size_counts[size] = size_counts.get(size, 0) + 1
                
    if font_counts:
        dominant_font = max(font_counts, key=font_counts.get)
        inferred_policies.append({
            "policy_id": "TPL-FMT-001",
            "target": "PARAGRAPH",
            "requirement": "FONT",
            "constraints": {"font_name": dominant_font},
            "obligation": "INFERRED",
            "source": "TEMPLATE",
            "status": "PENDING_CONFIRMATION",
            "original_rule": f"Inferred font '{dominant_font}' from template"
        })
        
    if size_counts:
        dominant_size = max(size_counts, key=size_counts.get)
        inferred_policies.append({
            "policy_id": "TPL-FMT-002",
            "target": "PARAGRAPH",
            "requirement": "FONT_SIZE",
            "constraints": {"font_size_pt": dominant_size},
            "obligation": "INFERRED",
            "source": "TEMPLATE",
            "status": "PENDING_CONFIRMATION",
            "original_rule": f"Inferred font size {dominant_size}pt from template"
        })
        
    return inferred_policies
