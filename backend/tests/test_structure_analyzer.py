import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.structure_analyzer import analyze_structure

def test_analyze_structure_missing_section():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="h1", type="heading", text="Introduction"),
            ElementModel(element_id="h2", type="heading", text="Methodology"),
            ElementModel(element_id="h3", type="heading", text="Conclusion")
        ],
        markdown="", full_text=""
    )
    
    required = ["Introduction", "Results", "Conclusion"]
    findings = analyze_structure(document, required_sections=required)
    
    assert len(findings) == 1
    assert "Results" in findings[0]["claim"]
    assert findings[0]["category"] == "CONTENT_COMPLETENESS"

def test_analyze_structure_all_present():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="h1", type="heading", text="Introduction"),
            ElementModel(element_id="h2", type="heading", text="Results"),
            ElementModel(element_id="h3", type="heading", text="Conclusion")
        ],
        markdown="", full_text=""
    )
    
    required = ["Introduction", "Results", "Conclusion"]
    findings = analyze_structure(document, required_sections=required)
    
    assert len(findings) == 0
