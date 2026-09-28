import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.formatting_analyzer import analyze_formatting

def test_analyze_formatting_incorrect_font():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="p1", type="paragraph", metadata={"font_name": "Arial", "font_size_pt": 12})
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_formatting(document, required_font="Times New Roman")
    assert len(findings) == 1
    assert "Arial" in findings[0]["claim"]
    assert findings[0]["category"] == "FORMATTING"

def test_analyze_formatting_correct():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="p1", type="paragraph", metadata={"font_name": "Times New Roman", "font_size_pt": 12})
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_formatting(document, required_font="Times New Roman", required_size_pt=12)
    assert len(findings) == 0
