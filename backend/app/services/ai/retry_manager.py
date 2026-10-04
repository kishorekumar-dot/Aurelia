"""
Retry Manager & Error Classification
Categorizes LLM/search failures and manages backoff/retry policies.
"""

import time
import random
import logging
from enum import Enum
from typing import Optional, Dict, Any

logger = logging.getLogger("aurelia.ai.retry")


class FailureType(str, Enum):
    TIMEOUT = "TIMEOUT"
    CONNECTION_FAILURE = "CONNECTION_FAILURE"
    RATE_LIMIT = "RATE_LIMIT"  # HTTP 429
    QUOTA_EXHAUSTED = "QUOTA_EXHAUSTED"  # HTTP 402 or 429 with quota notice
    AUTH_FAILURE = "AUTH_FAILURE"  # HTTP 401 or 403
    INVALID_API_KEY = "INVALID_API_KEY"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"  # HTTP 500, 502, 503, 504
    MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"  # HTTP 404 / model overloaded
    MALFORMED_RESPONSE = "MALFORMED_RESPONSE"
    INVALID_STRUCTURED_OUTPUT = "INVALID_STRUCTURED_OUTPUT"
    CONTENT_REFUSAL = "CONTENT_REFUSAL"
    UNEXPECTED_ERROR = "UNEXPECTED_ERROR"


class RetryAction(str, Enum):
    RETRY_SAME = "RETRY_SAME"  # Retry with exponential backoff on same key/model
    TRY_NEXT_KEY = "TRY_NEXT_KEY"  # Switch to next API key
    TRY_NEXT_MODEL = "TRY_NEXT_MODEL"  # Switch to next model in sequence
    RETRY_STRICT_JSON = "RETRY_STRICT_JSON"  # Retry with reinforced JSON instruction
    SAFE_FAIL = "SAFE_FAIL"  # Stop and return structured REVIEW_REQUIRED


class ErrorClassifier:
    """Classifies raw exceptions and HTTP status codes into structured FailureType."""

    @staticmethod
    def classify_http_error(status_code: int, response_text: str = "") -> FailureType:
        resp_lower = response_text.lower()

        if status_code == 401:
            return FailureType.AUTH_FAILURE
        if status_code == 403:
            return FailureType.INVALID_API_KEY
        if status_code == 402 or ("credit" in resp_lower or "quota" in resp_lower or "balance" in resp_lower):
            return FailureType.QUOTA_EXHAUSTED
        if status_code == 429:
            if "quota" in resp_lower or "exceeded your current" in resp_lower:
                return FailureType.QUOTA_EXHAUSTED
            return FailureType.RATE_LIMIT
        if status_code == 404 or "not found" in resp_lower or "model" in resp_lower and "unavailable" in resp_lower:
            return FailureType.MODEL_UNAVAILABLE
        if status_code in (500, 502, 503, 504):
            return FailureType.PROVIDER_UNAVAILABLE
        return FailureType.UNEXPECTED_ERROR

    @staticmethod
    def classify_exception(exc: Exception) -> FailureType:
        import httpx

        if isinstance(exc, httpx.TimeoutException):
            return FailureType.TIMEOUT
        if isinstance(exc, httpx.NetworkError):
            return FailureType.CONNECTION_FAILURE
        if isinstance(exc, httpx.HTTPStatusError):
            return ErrorClassifier.classify_http_error(
                exc.response.status_code, exc.response.text
            )
        
        name = type(exc).__name__.lower()
        msg = str(exc).lower()

        if "timeout" in name or "timeout" in msg:
            return FailureType.TIMEOUT
        if "connect" in name or "connection" in msg:
            return FailureType.CONNECTION_FAILURE
        if "json" in name or "decode" in msg or "parse" in msg:
            return FailureType.MALFORMED_RESPONSE
        if "validation" in name or "schema" in msg:
            return FailureType.INVALID_STRUCTURED_OUTPUT
        if "safety" in msg or "refusal" in msg or "policy" in msg:
            return FailureType.CONTENT_REFUSAL

        return FailureType.UNEXPECTED_ERROR


class RetryPolicy:
    """Determines backoff delay and recommended action based on failure type."""

    def __init__(self, base_delay: float = 1.0, max_delay: float = 10.0, max_retries: int = 2):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.max_retries = max_retries

    def determine_action(self, failure_type: FailureType, retry_count: int) -> RetryAction:
        if failure_type in (FailureType.RATE_LIMIT, FailureType.QUOTA_EXHAUSTED, FailureType.AUTH_FAILURE, FailureType.INVALID_API_KEY):
            return RetryAction.TRY_NEXT_KEY

        if failure_type == FailureType.MODEL_UNAVAILABLE:
            return RetryAction.TRY_NEXT_MODEL

        if failure_type in (FailureType.MALFORMED_RESPONSE, FailureType.INVALID_STRUCTURED_OUTPUT):
            if retry_count < 1:
                return RetryAction.RETRY_STRICT_JSON
            return RetryAction.TRY_NEXT_MODEL

        if failure_type in (FailureType.TIMEOUT, FailureType.CONNECTION_FAILURE, FailureType.PROVIDER_UNAVAILABLE):
            if retry_count < self.max_retries:
                return RetryAction.RETRY_SAME
            return RetryAction.TRY_NEXT_KEY

        if failure_type == FailureType.CONTENT_REFUSAL:
            return RetryAction.TRY_NEXT_MODEL

        return RetryAction.SAFE_FAIL

    def compute_backoff(self, retry_count: int) -> float:
        """Calculates exponential backoff with jitter."""
        delay = self.base_delay * (2 ** retry_count)
        jitter = random.uniform(0.1, 0.5)
        return min(self.max_delay, delay + jitter)

    def sleep_backoff(self, retry_count: int):
        delay = self.compute_backoff(retry_count)
        time.sleep(delay)
