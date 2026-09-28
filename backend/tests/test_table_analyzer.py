import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.table_analyzer import analyze_tables

def test_analyze_tables_missing_caption():
    document = DocumentModel(
        metadata={"title": "Test"},
        elements=[
            ElementModel(element_id="tbl1", type="table"),
        ],
        markdown="", full_text=""
    )
    
    findings = analyze_tables(document)
    assert len(findings) == 1
    assert "Table 'tbl1'" in findings[0]["claim"]
    assert findings[0]["category"] == "TABLE_COMPLIANCE"
