"""
Integrity & Fact Agent
Identifies unsupported factual claims and verifies them via external search (Tavily).
Only sends focused search queries (never the full document).
Never fabricates search results or sources.
"""

import re
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.services.document.document_model import DocumentModel
from app.services.search.search_service import search_service, SearchService
from app.services.ai.ai_service import ai_service, AIService
from app.services.evidence.evidence_builder import build_structured_finding

logger = logging.getLogger("aurelia.review.integrity")


class VerificationQuerySchema(BaseModel):
    needs_external_verification: bool
    claim_summary: str
    search_query: str
    rationale: str


class EvidenceEvaluationSchema(BaseModel):
    is_claim_supported: bool
    explanation: str
    confidence: float


class IntegrityAgent:
    """Specialized agent for academic integrity and factual claim verification."""

    def __init__(
        self,
        ai: Optional[AIService] = None,
        search: Optional[SearchService] = None
    ):
        self.ai = ai or ai_service
        self.search = search or search_service

    def analyze(self, document: DocumentModel) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []
        text = document.full_text or ""

        # Scan for technical claims (e.g. SOTA claims, dataset claims, algorithm performance assertions)
        candidate_snippets = self._extract_verifiable_claims(text)
        if not candidate_snippets:
            return findings

        # Limit to top candidate to conserve external quota and maintain high speed
        snippet = candidate_snippets[0]

        # 1. Ask LLM to extract a focused search query (never send full document)
        extraction_prompt = f"""
        Evaluate if the following excerpt from a student report makes a specific technical or empirical claim
        that requires external verification (e.g. 'Model X achieved 99% on Dataset Y' or 'We are the first to propose Z').
        
        Excerpt:
        \"\"\"{snippet}\"\"\"
        """

        extraction_res = self.ai.generate(
            prompt=extraction_prompt,
            schema=VerificationQuerySchema,
            model_preference="primary"
        )

        if not extraction_res.is_success or not extraction_res.data:
            return findings

        query_data: VerificationQuerySchema = (
            extraction_res.data
            if isinstance(extraction_res.data, VerificationQuerySchema)
            else VerificationQuerySchema(**extraction_res.data)
        )

        if not query_data.needs_external_verification or not query_data.search_query.strip():
            return findings

        # 2. Query Tavily with focused query only
        search_res = self.search.search(query=query_data.search_query, max_results=3)

        if search_res.get("status") == "SEARCH_UNAVAILABLE":
            findings.append(build_structured_finding(
                category="FACT",
                claim=f"Technical claim identified for verification: {query_data.claim_summary}",
                status="INSUFFICIENT",
                document_evidence={
                    "page": "location_unavailable",
                    "section": "Technical Discussion",
                    "excerpt": snippet[:200]
                },
                applicable_rule={"rule_id": "INT-001", "text": "Empirical claim verification policy"},
                external_evidence=[],
                reasoning_summary="External web search provider unavailable; external verification not performed.",
                confidence=0.5,
                authority_level="LECTURER_REVIEW",
                severity="info",
                recommendation="Lecturer should verify this technical claim manually."
            ))
            return findings

        # 3. LLM evaluates search sources against the claim
        sources = search_res.get("sources", [])
        if not sources:
            findings.append(build_structured_finding(
                category="FACT",
                claim=f"Unverified factual claim: {query_data.claim_summary}",
                status="INSUFFICIENT",
                document_evidence={
                    "page": "location_unavailable",
                    "section": "Technical Discussion",
                    "excerpt": snippet[:200]
                },
                applicable_rule={"rule_id": "INT-001", "text": "Empirical claim verification policy"},
                external_evidence=[],
                reasoning_summary=f"No external sources found to substantiate query: '{query_data.search_query}'.",
                confidence=0.65,
                authority_level="LECTURER_REVIEW",
                severity="minor",
                recommendation="Review citation or source for this specific assertion."
            ))
            return findings

        # Synthesize sources
        source_summaries = "\n".join([
            f"- [{s.get('title')}] ({s.get('url')}): {s.get('snippet')[:180]}"
            for s in sources[:3]
        ])

        eval_prompt = f"""
        Compare the student claim against the external search evidence.
        Claim: \"{query_data.claim_summary}\"
        
        External Evidence:
        {source_summaries}
        
        Does the external evidence support or contradict the claim?
        """

        eval_res = self.ai.generate(
            prompt=eval_prompt,
            schema=EvidenceEvaluationSchema,
            model_preference="primary"
        )

        if eval_res.is_success and eval_res.data:
            eval_data: EvidenceEvaluationSchema = (
                eval_res.data
                if isinstance(eval_res.data, EvidenceEvaluationSchema)
                else EvidenceEvaluationSchema(**eval_res.data)
            )

            status = "SUPPORTED" if eval_data.is_claim_supported else "CONTRADICTED"
            authority = "QUALIFIED_AI" if eval_data.is_claim_supported else "LECTURER_REVIEW"

            findings.append(build_structured_finding(
                category="FACT",
                claim=query_data.claim_summary,
                status=status,
                document_evidence={
                    "page": "location_unavailable",
                    "section": "Technical Discussion",
                    "excerpt": snippet[:200]
                },
                applicable_rule={"rule_id": "INT-002", "text": "Fact verification and citation authenticity"},
                external_evidence=sources,
                reasoning_summary=eval_data.explanation,
                confidence=eval_data.confidence,
                authority_level=authority,
                severity="minor" if eval_data.is_claim_supported else "major",
                recommendation=(
                    "External evidence corroborates claim."
                    if eval_data.is_claim_supported
                    else "Check potential contradiction with external literature."
                )
            ))

        return findings

    def _extract_verifiable_claims(self, text: str) -> List[str]:
        """Heuristically identifies candidate sentences containing empirical/technical assertions."""
        sentences = re.split(r"(?<=[.!?])\s+", text)
        candidates = []
        keywords = ["first to", "state of the art", "outperforms", "unprecedented", "achieved", "accuracy of 9", "benchmark"]
        for s in sentences:
            s_clean = s.strip()
            if 30 <= len(s_clean) <= 300 and any(kw in s_clean.lower() for kw in keywords):
                candidates.append(s_clean)
                if len(candidates) >= 2:
                    break
        return candidates


integrity_agent = IntegrityAgent()
