"""
Innovation & Contribution Agent
Extracts the student's claimed contribution, supporting statements, and missing evidence.
CRITICAL CONSTRAINT: This agent must NEVER automatically declare: "Your project is novel."
All novelty and significance determinations are strictly delegated to LEVEL 1 (LECTURER REVIEW).
"""

from typing import Dict, Any, List, Optional
from app.services.document.document_model import DocumentModel
from app.services.analyzers.innovation_analyzer import analyze_innovation
from app.services.evidence.evidence_builder import build_structured_finding


class ContributionAgent:
    """Specialized agent for contribution extraction and lecturer review delegation."""

    def analyze(self, document: DocumentModel) -> Dict[str, Any]:
        raw_result = analyze_innovation(document)
        metadata = raw_result.get("metadata", {})

        claimed = metadata.get("claimed_contribution", "Automated system and verification methodology.")
        evidence_doc = metadata.get("evidence_in_document", "Empirical evaluation presented in report.")
        missing = metadata.get("missing_evidence", [])

        # Construct structured finding with mandatory LECTURER_REVIEW authority
        finding = build_structured_finding(
            category="INNOVATION",
            claim="Claimed Project Contribution and Originality Assessment",
            status="SUPPORTED",
            document_evidence={
                "page": "location_unavailable",
                "section": "Introduction / Contribution",
                "excerpt": evidence_doc[:300]
            },
            applicable_rule={"rule_id": "INNOV-001", "text": "Academic contribution evaluation"},
            reasoning_summary=(
                f"Claimed contribution: '{claimed}'. "
                f"Missing evidence items identified: {', '.join(missing) if missing else 'None'}. "
                f"Originality and significance judgment requires academic faculty expertise."
            ),
            confidence=0.88,
            authority_level="LECTURER_REVIEW",  # Mandatory Level 1
            requires_expert_judgment=True,
            severity="info",
            recommendation="Faculty review required: Assess whether the claimed contribution meets academic threshold."
        )

        return {
            "finding": finding,
            "metadata": metadata
        }


contribution_agent = ContributionAgent()
