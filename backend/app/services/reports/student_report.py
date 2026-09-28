from typing import List, Dict, Any
from app.database.models import Document, Review, Finding
from app.services.document.document_model import DocumentModel

def generate_student_report(review_id: int, findings: List[Dict[str, Any]], project_summary: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates a simplified report for the student focusing on actionable corrections.
    """
    report_items = []
    for f in findings:
        # Only show verified or automatically recommended issues to students for correction
        if f.get("authority") in ["AUTOMATIC", "QUALIFIED_AI"] and f.get("status") == "VERIFIED":
            report_items.append({
                "issue": f.get("claim"),
                "location": f.get("location"),
                "recommendation": f.get("recommendation"),
                "category": f.get("category"),
                "severity": f.get("severity")
            })
            
    return {
        "title": "AcademicReview Corrective Report",
        "review_id": review_id,
        "summary": "Please address the following formatting and structural issues before final submission.",
        "project_understanding": project_summary.get("simple_explanation") if project_summary else "",
        "actionable_items": report_items
    }
