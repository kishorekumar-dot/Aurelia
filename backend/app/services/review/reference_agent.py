"""
Reference & Citation Agent
Verifies citation presence, reference count, and bibliographic consistency.
Does not claim a citation is fake without verified proof.
"""

from typing import List, Dict, Any
from app.services.document.document_model import DocumentModel
from app.services.analyzers.reference_analyzer import analyze_references
from app.services.evidence.evidence_builder import build_structured_finding


class ReferenceAgent:
    """Specialized citation and reference verification agent."""

    def analyze(self, document: DocumentModel, min_references: int = 5) -> List[Dict[str, Any]]:
        raw_findings = analyze_references(document, min_references=min_references)
        findings: List[Dict[str, Any]] = []

        for f in raw_findings:
            findings.append(build_structured_finding(
                category="REFERENCE_COMPLIANCE",
                claim=f.get("claim", "Citation issue"),
                status="VERIFIED",
                document_evidence={
                    "page": "location_unavailable",
                    "section": "References",
                    "excerpt": f.get("claim", "")
                },
                applicable_rule={"rule_id": f.get("policy_id", "REF-001"), "text": "Scholarly citation requirement"},
                confidence=0.95,
                authority_level="AUTOMATIC",
                severity=f.get("severity", "minor").lower(),
                recommendation=f.get("recommendation")
            ))

        return findings


reference_agent = ReferenceAgent()
