from typing import List, Dict, Any
from app.database.models import Document, Review, Finding
from app.services.document.document_model import DocumentModel

def generate_lecturer_report(review_id: int, findings: List[Dict[str, Any]], project_summary: Dict[str, Any] = None, innovation_summary: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates a comprehensive report for the lecturer including all findings, evidence, and AI assistance.
    """
    verified = [f for f in findings if f.get("status") == "VERIFIED" and f.get("authority") == "AUTOMATIC"]
    human_review = [f for f in findings if f.get("authority") in ["LECTURER", "QUALIFIED_AI"] or f.get("status") == "INSUFFICIENT"]
    contradicted = [f for f in findings if f.get("status") == "CONTRADICTED"]
    
    return {
        "title": "AcademicReview Comprehensive Report",
        "review_id": review_id,
        "project_summary": project_summary,
        "innovation_assessment": innovation_summary,
        "metrics": {
            "total_findings": len(findings),
            "verified_automatic": len(verified),
            "requires_human_review": len(human_review),
            "contradicted": len(contradicted)
        },
        "verified_findings": verified,
        "requires_review_findings": human_review,
        "contradicted_findings": contradicted
    }
