import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.figure_analyzer import analyze_figures

def test_analyze_figures_missing_caption():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="p1", type="paragraph", text="Some text"),
            ElementModel(element_id="fig1", type="figure"),
            ElementModel(element_id="p2", type="paragraph", text="More text")
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_figures(document)
    
    assert len(findings) == 1
    assert findings[0]["claim"] == "Figure 'fig1' does not have an associated caption."
    assert findings[0]["category"] == "FIGURE_COMPLIANCE"

def test_analyze_figures_with_caption():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="p1", type="paragraph", text="Some text"),
            ElementModel(element_id="fig1", type="figure"),
            ElementModel(element_id="cap1", type="caption", text="Figure 1: Test caption")
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_figures(document)
    
    assert len(findings) == 0
