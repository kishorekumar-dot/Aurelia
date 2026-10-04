"""
Comprehensive Test Suite for AI Infrastructure
Tests:
1. Primary API key success
2. Primary key failure -> second key fallback
3. All primary keys fail -> fallback model
4. Rate limit handling (HTTP 429)
5. Timeout handling
6. Invalid API key handling (HTTP 401/403)
7. Tavily key fallback
8. Tavily unavailable -> SEARCH_UNAVAILABLE
9. Malformed LLM JSON -> retry strict schema
10. Deterministic formatting checks
11. Evidence sufficiency
12. Authority routing
13. Safe failure (REVIEW_REQUIRED)
14. API keys never exposed in responses or logs
"""

import pytest
from unittest.mock import MagicMock, patch
from pydantic import BaseModel

from app.services.ai.openrouter_key_manager import OpenRouterKeyManager, KeyStatus
from app.services.ai.model_manager import ModelManager
from app.services.ai.retry_manager import (
    ErrorClassifier,
    FailureType,
    RetryPolicy,
    RetryAction,
)
from app.services.ai.openrouter_client import (
    OpenRouterClient,
    OpenRouterException,
)
from app.services.ai.ai_service import AIService, AIResult
from app.services.search.tavily_key_manager import TavilyKeyManager
from app.services.search.tavily_client import TavilyClient
from app.services.search.search_service import SearchService
from app.services.evidence.claim_classifier import classify_claim_type, ClaimType
from app.services.evidence.evidence_sufficiency import evaluate_evidence_sufficiency, FindingStatus
from app.services.evidence.authority_decision import determine_authority_level, AuthorityLevel
from app.services.document.deterministic_checks import (
    check_font_size,
    check_margin,
    check_required_sections,
    check_heading_structure,
    check_figure_captions,
    check_reference_count,
)
from app.services.document.document_model import DocumentModel, ElementModel


class SampleResponseSchema(BaseModel):
    summary: str
    score: float


# ==============================================================================
# 1. Primary API Key Success
# ==============================================================================
def test_primary_key_success():
    key_mgr = OpenRouterKeyManager(["key-primary", "key-backup"])
    model_mgr = ModelManager("model-primary", "model-backup-1", "model-backup-2")
    mock_client = MagicMock()
    mock_client.generate.return_value = {
        "status": "SUCCESS",
        "structured_data": SampleResponseSchema(summary="Validated successfully", score=95.0),
        "raw_text": '{"summary": "Validated successfully", "score": 95.0}',
        "model_used": "model-primary",
        "key_index": 1,
        "latency": 0.25,
    }

    service = AIService(key_manager=key_mgr, models=model_mgr, client=mock_client)
    res = service.generate("Review this text", schema=SampleResponseSchema)

    assert res.is_success is True
    assert res.status == "SUCCESS"
    assert res.model_used == "model-primary"
    assert res.key_masked == "OpenRouter Key #1"
    assert res.data.summary == "Validated successfully"
    assert res.publishable is False  # Never directly publishable to students
    # Verify mock was called once with primary key
    assert mock_client.generate.call_count == 1
    call_args = mock_client.generate.call_args[1]
    assert call_args["api_key"] == "key-primary"


# ==============================================================================
# 2. Primary Key Failure -> Second Key Fallback
# ==============================================================================
def test_primary_key_failure_fallback_to_second_key():
    key_mgr = OpenRouterKeyManager(["key-1-failing", "key-2-working"])
    model_mgr = ModelManager("model-primary", "model-backup-1", "model-backup-2")
    mock_client = MagicMock()

    # Key 1 throws 429 RateLimitError, Key 2 succeeds
    mock_client.generate.side_effect = [
        OpenRouterException("Rate limit exceeded", failure_type=FailureType.RATE_LIMIT, status_code=429),
        {
            "status": "SUCCESS",
            "structured_data": SampleResponseSchema(summary="Key 2 Success", score=88.0),
            "raw_text": '{"summary": "Key 2 Success", "score": 88.0}',
            "model_used": "model-primary",
            "key_index": 2,
            "latency": 0.3,
        }
    ]

    service = AIService(key_manager=key_mgr, models=model_mgr, client=mock_client)
    res = service.generate("Analyze", schema=SampleResponseSchema)

    assert res.is_success is True
    assert res.key_masked == "OpenRouter Key #2"
    assert mock_client.generate.call_count == 2
    # Verify Key 1 was put on cooldown
    assert key_mgr._keys[0].is_in_cooldown is True


# ==============================================================================
# 3. All Primary Keys Fail -> Fallback Model
# ==============================================================================
def test_all_keys_fail_primary_model_fallback_to_secondary_model():
    key_mgr = OpenRouterKeyManager(["key-1", "key-2"])
    model_mgr = ModelManager("model-primary", "model-fallback-1", "model-fallback-2")
    mock_client = MagicMock()

    def side_effect_fn(*args, **kwargs):
        model = kwargs.get("model")
        if model == "model-primary":
            raise OpenRouterException("Model unavailable / overloaded", failure_type=FailureType.MODEL_UNAVAILABLE, status_code=404)
        elif model == "model-fallback-1":
            return {
                "status": "SUCCESS",
                "structured_data": SampleResponseSchema(summary="Fallback Model Succeeded", score=90.0),
                "raw_text": '{"summary": "Fallback Model Succeeded", "score": 90.0}',
                "model_used": "model-fallback-1",
                "key_index": 1,
                "latency": 0.4,
            }
        raise RuntimeError("Unexpected model")

    mock_client.generate.side_effect = side_effect_fn

    service = AIService(key_manager=key_mgr, models=model_mgr, client=mock_client)
    res = service.generate("Analyze", schema=SampleResponseSchema)

    assert res.is_success is True
    assert res.model_used == "model-fallback-1"
    assert res.data.summary == "Fallback Model Succeeded"


# ==============================================================================
# 4. Rate Limit Handling (HTTP 429)
# ==============================================================================
def test_rate_limit_classification_and_cooldown():
    err_type = ErrorClassifier.classify_http_error(429, "Rate limit reached for requests per minute")
    assert err_type == FailureType.RATE_LIMIT

    key_mgr = OpenRouterKeyManager(["key-rate-limited"])
    key_mgr.mark_failure(key_index=1, error_type=FailureType.RATE_LIMIT.value, cooldown_seconds=60.0)
    assert key_mgr._keys[0].is_in_cooldown is True
    assert key_mgr._keys[0].failure_count == 1


# ==============================================================================
# 5. Timeout Handling with Backoff
# ==============================================================================
def test_timeout_retry_handling():
    policy = RetryPolicy(base_delay=0.01, max_delay=0.05, max_retries=2)
    action = policy.determine_action(FailureType.TIMEOUT, retry_count=0)
    assert action == RetryAction.RETRY_SAME

    action_max = policy.determine_action(FailureType.TIMEOUT, retry_count=2)
    assert action_max == RetryAction.TRY_NEXT_KEY


# ==============================================================================
# 6. Invalid API Key Handling (HTTP 401/403)
# ==============================================================================
def test_invalid_api_key_deactivation():
    key_mgr = OpenRouterKeyManager(["bad-key", "good-key"])
    key_mgr.mark_failure(key_index=1, error_type="AUTH_FAILURE")

    # Key 1 must be marked inactive, leaving only Key 2
    assert key_mgr._keys[0].is_active is False
    candidates = key_mgr.get_candidate_keys()
    assert len(candidates) == 1
    assert candidates[0].key == "good-key"


# ==============================================================================
# 7. Tavily Key Fallback
# ==============================================================================
def test_tavily_key_fallback():
    key_mgr = TavilyKeyManager(["tav-key-1", "tav-key-2"])
    mock_client = MagicMock()

    mock_client.search.side_effect = [
        {"status": "ERROR", "error_type": "RATE_LIMIT", "query": "q", "results": []},
        {
            "status": "SUCCESS",
            "query": "q",
            "results": [{"title": "Web Paper", "url": "https://example.com/p", "content": "Text", "score": 0.9}],
            "key_index": 2,
            "latency": 0.2,
        }
    ]

    service = SearchService(key_manager=key_mgr, client=mock_client)
    res = service.search("deep learning benchmarks")

    assert res["status"] == "SUCCESS"
    assert res["key_used"] == "Tavily Key #2"
    assert len(res["sources"]) == 1
    assert res["sources"][0]["title"] == "Web Paper"


# ==============================================================================
# 8. Tavily Unavailable -> SEARCH_UNAVAILABLE (Never Fabricate)
# ==============================================================================
def test_tavily_unavailable_never_fabricates():
    key_mgr = TavilyKeyManager(["tav-key-1"])
    mock_client = MagicMock()
    mock_client.search.return_value = {
        "status": "ERROR",
        "error_type": "PROVIDER_UNAVAILABLE",
        "query": "q",
        "results": [],
    }

    service = SearchService(key_manager=key_mgr, client=mock_client)
    res = service.search("novel distributed consensus")

    assert res["status"] == "SEARCH_UNAVAILABLE"
    assert len(res["sources"]) == 0
    assert "unavailable" in res["reason"].lower()


# ==============================================================================
# 9. Malformed LLM JSON Handling (Retry with Strict Mode)
# ==============================================================================
def test_malformed_json_retry_strict():
    key_mgr = OpenRouterKeyManager(["key-1"])
    model_mgr = ModelManager("model-1")
    mock_client = MagicMock()

    mock_client.generate.side_effect = [
        OpenRouterException("Malformed json response", failure_type=FailureType.INVALID_STRUCTURED_OUTPUT),
        {
            "status": "SUCCESS",
            "structured_data": SampleResponseSchema(summary="Strict JSON Success", score=85.0),
            "raw_text": '{"summary": "Strict JSON Success", "score": 85.0}',
            "model_used": "model-1",
            "key_index": 1,
            "latency": 0.3,
        }
    ]

    service = AIService(key_manager=key_mgr, models=model_mgr, client=mock_client)
    res = service.generate("Analyze", schema=SampleResponseSchema)

    assert res.is_success is True
    assert res.data.summary == "Strict JSON Success"
    assert mock_client.generate.call_count == 2
    # Verify second call had is_retry_strict=True
    assert mock_client.generate.call_args_list[1][1]["is_retry_strict"] is True


# ==============================================================================
# 10. Deterministic Formatting Checks (Pure Python)
# ==============================================================================
def test_deterministic_checks():
    doc = DocumentModel(
        metadata={"margin_inches": 1.5},
        elements=[
            ElementModel(element_id="p1", type="paragraph", text="Intro", section="Introduction", metadata={"font_size_pt": 14}),
            ElementModel(element_id="p2", type="paragraph", text="Body", section="Introduction", metadata={"font_size_pt": 12}),
            ElementModel(element_id="h1", type="heading", text="Introduction", section="Introduction", metadata={"level": 1}),
            ElementModel(element_id="h2", type="heading", text="Sub-detail", section="Introduction", metadata={"level": 3}),  # Skipped level
            ElementModel(element_id="f1", type="figure", text="", section="Introduction", metadata={}),  # Missing caption
            ElementModel(element_id="ref1", type="reference", text="[1] Smith et al.", section="References"),
        ],
        markdown="",
        full_text="Introduction text..."
    )

    # 1. Font size check
    font_violations = check_font_size(doc, {"font_size_pt": 12})
    assert len(font_violations) == 1
    assert font_violations[0]["actual_size"] == 14

    # 2. Margin check
    margin_violations = check_margin(doc, {"margin_inches": 1.0})
    assert len(margin_violations) == 1
    assert margin_violations[0]["actual_margin"] == 1.5

    # 3. Required sections check
    section_violations = check_required_sections(doc, {"required_sections": ["Introduction", "Methodology", "Conclusion"]})
    assert len(section_violations) == 1
    assert "Methodology" in section_violations[0]["missing_sections"]

    # 4. Heading structure check (H1 -> H3 skip)
    heading_violations = check_heading_structure(doc)
    assert len(heading_violations) == 1
    assert heading_violations[0]["last_level"] == 1 and heading_violations[0]["level"] == 3

    # 5. Figure caption check
    caption_violations = check_figure_captions(doc)
    assert len(caption_violations) == 1

    # 6. Reference count check
    ref_violations = check_reference_count(doc, {"min_references": 5})
    assert len(ref_violations) == 1
    assert ref_violations[0]["actual_count"] == 1


# ==============================================================================
# 11. Evidence Sufficiency Evaluation
# ==============================================================================
def test_evidence_sufficiency_statuses():
    # 1. Deterministic formatting verified
    status_fmt = evaluate_evidence_sufficiency(
        finding={"category": "FORMATTING", "method": "document_parser"},
        document_evidence=[{"confidence": 1.0, "observation": "Font size is 14pt"}]
    )
    assert status_fmt == FindingStatus.VERIFIED.value

    # 2. Semantic supported
    status_sup = evaluate_evidence_sufficiency(
        finding={"category": "CONTENT", "method": "llm"},
        document_evidence=[{"confidence": 0.82, "observation": "Methodology details missing ablation"}]
    )
    assert status_sup == FindingStatus.SUPPORTED.value

    # 3. Contradicted
    status_contra = evaluate_evidence_sufficiency(
        finding={"category": "CONSISTENCY"},
        document_evidence=[{"value": True, "observation": "exists"}, {"value": False, "observation": "missing"}]
    )
    assert status_contra == FindingStatus.CONTRADICTED.value

    # 4. Insufficient (no evidence or low confidence)
    status_insuff = evaluate_evidence_sufficiency(
        finding={"category": "CONTENT"},
        document_evidence=[{"confidence": 0.4, "observation": "vague impression"}]
    )
    assert status_insuff == FindingStatus.INSUFFICIENT.value


# ==============================================================================
# 12. Authority Routing Tiers
# ==============================================================================
def test_authority_routing_tiers():
    # LEVEL 3 — AUTOMATIC (Deterministic formatting / structure)
    auth_fmt = determine_authority_level(claim_type=ClaimType.FORMAT.value, status="VERIFIED", confidence=1.0)
    assert auth_fmt == AuthorityLevel.LEVEL_3_AUTOMATIC.value

    # LEVEL 2 — QUALIFIED AI (Content / methodology with high confidence)
    auth_content = determine_authority_level(claim_type=ClaimType.CONTENT.value, status="SUPPORTED", confidence=0.85)
    assert auth_content == AuthorityLevel.LEVEL_2_QUALIFIED_AI.value

    # LEVEL 1 — LECTURER REVIEW (Originality / Novelty / Academic Contribution)
    auth_novelty = determine_authority_level(claim_type=ClaimType.ORIGINALITY.value, status="SUPPORTED")
    assert auth_novelty == AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value

    auth_contrib = determine_authority_level(claim_type=ClaimType.CONTRIBUTION.value, status="SUPPORTED")
    assert auth_contrib == AuthorityLevel.LEVEL_1_LECTURER_REVIEW.value


# ==============================================================================
# 13. Safe Failure (REVIEW_REQUIRED, Never Fabricate)
# ==============================================================================
def test_safe_failure_when_all_ai_providers_fail():
    key_mgr = OpenRouterKeyManager([])  # No keys configured
    model_mgr = ModelManager()
    mock_client = MagicMock()

    service = AIService(key_manager=key_mgr, models=model_mgr, client=mock_client)
    # Patch Gemini emergency to also fail
    with patch.object(service, "_try_gemini_fallback", return_value=None):
        res = service.generate("Analyze contribution")

    assert res.is_success is False
    assert res.status == "REVIEW_REQUIRED"
    assert res.data is None
    assert res.publishable is False
    assert "unavailable" in res.failure_reason.lower()


# ==============================================================================
# 14. API Keys Not Exposed in Responses or Public Strings
# ==============================================================================
def test_api_keys_never_exposed():
    secret_key = "sk-or-v1-secret-super-sensitive-key-99999"
    key_mgr = OpenRouterKeyManager([secret_key])
    status = key_mgr._keys[0]

    assert secret_key not in status.masked_name
    assert status.masked_name == "OpenRouter Key #1"

    # Verify AIResult contains masked key only
    result = AIResult(status="SUCCESS", key_masked=status.masked_name, data={"ok": True})
    result_str = str(result)
    assert secret_key not in result_str
    assert "OpenRouter Key #1" in result_str
