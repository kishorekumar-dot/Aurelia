"""
Content & Project Understanding Agent
Evaluates objectives, methodology, problem formulation, and semantic rigor.
Delegates LLM calls to AIService.
"""

from typing import List, Dict, Any, Optional
from app.services.document.document_model import DocumentModel
from app.services.analyzers.project_understanding import (
    analyze_project_understanding,
    ProjectSummarySchema,
)
from app.services.evidence.evidence_builder import build_structured_finding
from app.services.ai.ai_service import ai_service


class ContentAgent:
    """Specialized agent for academic project content and methodology evaluation."""

    def analyze(self, document: DocumentModel) -> Dict[str, Any]:
        """
        Returns structured project summary and content findings.
        """
        summary_schema = analyze_project_understanding(document)
        summary = summary_schema.model_dump()

        findings: List[Dict[str, Any]] = []

        # Check for clear methodology
        methodology = summary.get("methodology", "")
        if len(methodology.split()) < 8 or "not specified" in methodology.lower():
            findings.append(build_structured_finding(
                category="CONTENT",
                claim="Methodology description lacks detailed procedural steps or experimental parameters.",
                status="SUPPORTED",
                document_evidence={
                    "page": "location_unavailable",
                    "section": "Methodology",
                    "excerpt": methodology[:200]
                },
                applicable_rule={"rule_id": "CONT-001", "text": "Methodology completeness requirement"},
                reasoning_summary="Identified sparse methodology description during semantic content extraction.",
                confidence=0.85,
                authority_level="QUALIFIED_AI",
                severity="major",
                recommendation="Elaborate on specific experimental baselines, datasets, and pipeline configurations."
            ))

        # Check for concrete objectives
        objectives = summary.get("objectives", [])
        if len(objectives) == 0:
            findings.append(build_structured_finding(
                category="CONTENT",
                claim="Project objectives are not explicitly delineated.",
                status="SUPPORTED",
                document_evidence={
                    "page": 1,
                    "section": "Introduction / Objectives",
                    "excerpt": "No explicit numbered or bulleted objectives detected."
                },
                applicable_rule={"rule_id": "CONT-002", "text": "Explicit project objectives definition"},
                confidence=0.88,
                authority_level="QUALIFIED_AI",
                severity="minor",
                recommendation="Provide 2-4 clearly articulated project objectives in the introductory section."
            ))

        return {
            "summary": summary,
            "findings": findings
        }


content_agent = ContentAgent()
