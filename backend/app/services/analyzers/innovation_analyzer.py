from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.ai.llm_client import LLMClient
from app.services.document.document_model import DocumentModel

class InnovationAssessmentSchema(BaseModel):
    claimed_contribution: str
    evidence_in_document: str
    supporting_evidence: List[str]
    missing_evidence: List[str]
    uncertainty: str
    questions_for_lecturer: List[str]
    classification: str # DIRECTLY SUPPORTED, PARTIALLY SUPPORTED, INSUFFICIENT EVIDENCE, LECTURER JUDGMENT REQUIRED

def analyze_innovation(document: DocumentModel, llm: LLMClient) -> Dict[str, Any]:
    """
    Assesses the innovation and contribution claimed by the project.
    This is an ASSISTIVE module (Level 1 Authority - Lecturer Judgment).
    """
    doc_text = document.full_text[:15000]
    
    prompt = f"""
    Analyze the following academic project report specifically for innovation and contribution.
    Do NOT automatically declare the project is novel.
    Identify the claimed contribution, the evidence supporting it, and any missing evidence.
    Classify it into one of: DIRECTLY SUPPORTED, PARTIALLY SUPPORTED, INSUFFICIENT EVIDENCE, LECTURER JUDGMENT REQUIRED.
    
    Document Text:
    {doc_text}
    """
    
    result = llm.generate_structured(prompt, InnovationAssessmentSchema)
    
    finding = {
        "claim": "Innovation and Contribution Assessment",
        "category": "INNOVATION",
        "severity": "INFO",
        "location": None,
        "policy_id": "INNOV-001",
        "status": "VERIFIED",
        "authority": "LECTURER", # Level 1
        "recommendation": "Review the innovation assessment and provide judgment.",
        "metadata": result.model_dump()
    }
    
    return finding
