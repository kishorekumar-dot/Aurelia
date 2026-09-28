import pytest
from unittest.mock import MagicMock
from app.services.ai.llm_client import LLMClient
from app.services.document.document_model import DocumentModel, ElementModel
from app.services.analyzers.project_understanding import analyze_project_understanding, ProjectSummarySchema
from app.services.analyzers.innovation_analyzer import analyze_innovation

def test_analyze_project_understanding():
    mock_llm = MagicMock()
    mock_llm.generate_structured.return_value = ProjectSummarySchema(
        title="Test Title",
        problem="Test Problem",
        objectives=["Obj 1"],
        solution="Solution",
        methodology="Method",
        technologies=["Tech"],
        datasets=["Dataset"],
        results="Results",
        conclusion="Conclusion",
        claimed_contribution="Contribution",
        simple_explanation="Explanation",
        key_points=["Key 1"],
        viva_questions=["Q1"]
    )
    
    document = DocumentModel(metadata={}, elements=[], markdown="", full_text="test")
    result = analyze_project_understanding(document, mock_llm)
    
    assert result.title == "Test Title"
    assert len(result.objectives) == 1

def test_analyze_innovation():
    mock_llm = MagicMock()
    # We mock the return structure
    class MockInnovationSchema:
        claimed_contribution = "Contribution"
        evidence_in_document = "Evidence"
        supporting_evidence = ["Ev 1"]
        missing_evidence = []
        uncertainty = "Low"
        questions_for_lecturer = ["Q"]
        classification = "DIRECTLY SUPPORTED"
        
        def model_dump(self):
            return {"classification": self.classification}
            
    mock_llm.generate_structured.return_value = MockInnovationSchema()
    
    document = DocumentModel(metadata={}, elements=[], markdown="", full_text="test")
    finding = analyze_innovation(document, mock_llm)
    
    assert finding["category"] == "INNOVATION"
    assert finding["authority"] == "LECTURER"
    assert finding["metadata"]["classification"] == "DIRECTLY SUPPORTED"
