import pytest
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.policy.policy_inference import infer_template_policies
from app.services.evidence.evidence_builder import build_evidence, detect_contradictions

def test_infer_template_policies():
    document = DocumentModel(
        metadata={"title": "Template"},
        elements=[
            ElementModel(element_id="p1", type="paragraph", metadata={"font_name": "Arial", "font_size_pt": 11}),
            ElementModel(element_id="p2", type="paragraph", metadata={"font_name": "Arial", "font_size_pt": 11})
        ],
        markdown="", full_text=""
    )
    
    inferred = infer_template_policies(document)
    assert len(inferred) == 2
    assert inferred[0]["status"] == "PENDING_CONFIRMATION"

def test_evidence_builder():
    finding = {"location": {"page": 1}}
    evidence = build_evidence(finding, "doc.pdf", "Saw a figure", True, "parser")
    assert evidence["source"] == "doc.pdf"
    assert evidence["value"] is True

def test_detect_contradictions():
    evidence_list = [
        {"value": True},
        {"value": False}
    ]
    assert detect_contradictions(evidence_list) is True
    
    evidence_list_no_contradiction = [
        {"value": True},
        {"value": True}
    ]
    assert detect_contradictions(evidence_list_no_contradiction) is False
