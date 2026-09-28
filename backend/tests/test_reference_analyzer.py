import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.reference_analyzer import analyze_references

def test_analyze_references_none():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[],
        markdown="", full_text=""
    )
    
    findings = analyze_references(document)
    assert len(findings) == 1
    assert "No references found" in findings[0]["claim"]

def test_analyze_references_insufficient():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="r1", type="reference"),
            ElementModel(element_id="r2", type="reference")
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_references(document, min_references=5)
    assert len(findings) == 1
    assert "Insufficient references" in findings[0]["claim"]
