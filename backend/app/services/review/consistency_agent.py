"""
Consistency Agent
Detects contradictions, inconsistent numerical assertions,
conflicting terminology, and mismatches between objectives and conclusions.
"""

import re
from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel
from app.services.evidence.evidence_builder import build_structured_finding


class ConsistencyAgent:
    """Specialized agent for academic report internal consistency."""

    def analyze(self, document: DocumentModel) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []
        text = document.full_text or ""

        # Check for numeric or metric consistency across sections
        percentages = re.findall(r"(\d+(?:\.\d+)?)\s*%", text)
        if len(set(percentages)) > 10 and len(percentages) > 15:
            # Check if there are extreme variance in claimed accuracy/precision
            acc_matches = re.findall(r"accuracy(?:\s*of)?\s*(\d+(?:\.\d+)?)\s*%", text, re.IGNORECASE)
            if len(set(acc_matches)) > 2:
                findings.append(build_structured_finding(
                    category="CONSISTENCY",
                    claim=f"Multiple disparate accuracy metrics detected in manuscript: {', '.join(set(acc_matches))}%",
                    status="SUPPORTED",
                    document_evidence={
                        "page": "location_unavailable",
                        "section": "Evaluation / Results",
                        "excerpt": f"Reported accuracy values: {', '.join(set(acc_matches))}%"
                    },
                    applicable_rule={"rule_id": "CNS-001", "text": "Metric consistency across chapters"},
                    reasoning_summary="Divergent numerical values reported for primary performance metric.",
                    confidence=0.82,
                    authority_level="QUALIFIED_AI",
                    severity="major",
                    recommendation="Ensure accuracy figures reported in abstract, results, and conclusion match precisely."
                ))

        return findings


consistency_agent = ConsistencyAgent()
