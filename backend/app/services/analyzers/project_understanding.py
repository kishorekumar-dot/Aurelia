from pydantic import BaseModel
from typing import List, Optional
from app.services.ai.llm_client import LLMClient
from app.services.document.document_model import DocumentModel

class ProjectSummarySchema(BaseModel):
    title: str
    problem: str
    objectives: List[str]
    solution: str
    methodology: str
    technologies: List[str]
    datasets: List[str]
    results: str
    conclusion: str
    claimed_contribution: str
    simple_explanation: str
    key_points: List[str]
    viva_questions: List[str]

def analyze_project_understanding(document: DocumentModel, llm: LLMClient) -> ProjectSummarySchema:
    """
    Extracts semantic understanding of the project.
    """
    # Create a summarized version of the document to fit context windows efficiently
    # For MVP, we pass the first 15000 characters of full_text
    doc_text = document.full_text[:15000] 
    
    prompt = f"""
    Analyze the following academic project report and extract key information.
    Do NOT invent results. Differentiate between EXPLICIT claims and INFERRED ones where applicable.
    
    Document Text:
    {doc_text}
    """
    
    return llm.generate_structured(prompt, ProjectSummarySchema)
