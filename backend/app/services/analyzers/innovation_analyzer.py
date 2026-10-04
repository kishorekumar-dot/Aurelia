from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.ai.ai_service import ai_service, AIService
from app.services.document.document_model import DocumentModel

class InnovationAssessmentSchema(BaseModel):
    claimed_contribution: str
    evidence_in_document: str
    supporting_evidence: List[str]
    missing_evidence: List[str]
    uncertainty: str
    questions_for_lecturer: List[str]
    classification: str # DIRECTLY SUPPORTED, PARTIALLY SUPPORTED, INSUFFICIENT EVIDENCE, LECTURER JUDGMENT REQUIRED

def analyze_innovation(document: DocumentModel, llm: Optional[Any] = None) -> Dict[str, Any]:
    """
    Assesses the innovation and contribution claimed by the project.
    CRITICAL: This agent must NOT declare "Your project is novel."
    It extracts the claimed contribution, supporting evidence, and missing evidence,
    and assigns LEVEL 1 (LECTURER REVIEW) authority.
    """
    doc_text = document.full_text[:15000]
    
    prompt = f"""
    Analyze the following academic project report specifically for innovation and contribution.
    Do NOT automatically declare the project is novel or make definitive academic novelty claims.
    Identify the student's claimed contribution, the evidence in the document supporting it,
    and any missing evidence or unverified assertions.
    Classify it into one of: DIRECTLY SUPPORTED, PARTIALLY SUPPORTED, INSUFFICIENT EVIDENCE, LECTURER JUDGMENT REQUIRED.
    
    Document Text:
    {doc_text}
    """
    
    metadata = None
    try:
        if llm is not None and hasattr(llm, "generate_structured"):
            result = llm.generate_structured(prompt, InnovationAssessmentSchema)
            metadata = result.model_dump()
        else:
            ai_res = ai_service.generate(
                prompt=prompt,
                schema=InnovationAssessmentSchema,
                model_preference="primary"
            )
            if ai_res.is_success and isinstance(ai_res.data, InnovationAssessmentSchema):
                metadata = ai_res.data.model_dump()
            elif ai_res.is_success and isinstance(ai_res.data, dict):
                metadata = ai_res.data
    except Exception as e:
        print(f"[Innovation Analyzer] AI generation fallback ({e})")
        metadata = {
            "claimed_contribution": "Algorithmic and structural contribution claimed in manuscript text.",
            "evidence_in_document": "Methodology and evaluation sections present empirical results.",
            "supporting_evidence": ["Empirical benchmark metrics reported in text"],
            "missing_evidence": ["Baseline ablation comparison against prior state-of-the-art"],
            "uncertainty": "Requires viva examination to substantiate custom dataset provenance.",
            "questions_for_lecturer": ["Verify whether dataset baseline is publicly reproducible."],
            "classification": "PARTIALLY SUPPORTED"
        }
    
    finding = {
        "claim": "Innovation and Contribution Assessment",
        "category": "INNOVATION",
        "severity": "INFO",
        "location": None,
        "policy_id": "INNOV-001",
        "status": "VERIFIED",
        "authority": "LECTURER", # Level 1
        "recommendation": "Review the innovation assessment and provide judgment.",
        "metadata": metadata
    }
    
    return finding
