import pytest
import os
from app.services.review.orchestrator import run_orchestrator

def test_run_orchestrator():
    # We will test on the sample docx file that is already in the project
    sample_path = "sample_documents/sample_paper.docx"
    
    # Only run this test if the sample file exists
    if not os.path.exists(sample_path):
        pytest.skip(f"Sample file {sample_path} not found")
        
    result = run_orchestrator(sample_path, run_llm=True)
    
    assert "student_report" in result
    assert "lecturer_report" in result
    assert "raw_findings" in result
    
    lecturer_report = result["lecturer_report"]
    assert lecturer_report["title"] == "AcademicReview Comprehensive Report"
    
    # Since we provided a Gemini API Key, project_summary shouldn't be None
    assert lecturer_report["project_summary"] is not None
    assert lecturer_report["metrics"]["total_findings"] > 0
