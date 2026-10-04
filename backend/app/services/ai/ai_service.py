"""
Unified AIService
Coordinates OpenRouter multi-key and multi-model fallback, retry backoff,
emergency Gemini fallback, and safe failure routing.
All agents interact exclusively with AIService, never directly with keys or raw APIs.
"""

import time
import logging
from typing import Optional, Type, TypeVar, Any, Dict, List
from dataclasses import dataclass, field
from pydantic import BaseModel

from app.core.config import settings
from app.services.ai.openrouter_key_manager import (
    openrouter_key_manager,
    OpenRouterKeyManager,
    KeyStatus,
)
from app.services.ai.model_manager import model_manager, ModelManager
from app.services.ai.retry_manager import (
    RetryPolicy,
    FailureType,
    RetryAction,
)
from app.services.ai.openrouter_client import (
    openrouter_client,
    OpenRouterClient,
    OpenRouterException,
)

logger = logging.getLogger("aurelia.ai.service")
T = TypeVar("T", bound=BaseModel)


@dataclass
class AIResult:
    status: str  # "SUCCESS", "REVIEW_REQUIRED", "AI_UNAVAILABLE"
    data: Optional[Any] = None
    raw_text: Optional[str] = None
    provider: str = "openrouter"
    model_used: Optional[str] = None
    key_masked: Optional[str] = None
    latency: float = 0.0
    attempts: int = 0
    failure_reason: Optional[str] = None
    publishable: bool = False  # NEVER publish raw AI output without lecturer approval

    @property
    def is_success(self) -> bool:
        return self.status == "SUCCESS" and self.data is not None


class AIService:
    """
    Central AI orchestration service for all specialized agents.
    Handles key fallback, model fallback, retries, and safe failure.
    """

    def __init__(
        self,
        key_manager: Optional[OpenRouterKeyManager] = None,
        models: Optional[ModelManager] = None,
        client: Optional[OpenRouterClient] = None,
        retry_policy: Optional[RetryPolicy] = None,
    ):
        self.key_manager = key_manager or openrouter_key_manager
        self.model_manager = models or model_manager
        self.client = client or openrouter_client
        self.retry_policy = retry_policy or RetryPolicy(
            base_delay=1.0,
            max_delay=8.0,
            max_retries=settings.OPENROUTER_MAX_RETRIES,
        )

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model_preference: str = "primary",
        schema: Optional[Type[T]] = None,
        temperature: float = 0.2,
    ) -> AIResult:
        """
        Primary interface for agent LLM execution.
        Follows the hierarchical key-fallback and model-fallback algorithm.
        """
        start_time = time.time()
        total_attempts = 0
        last_failure_reason = None

        # Check if any OpenRouter keys exist
        candidate_keys = self.key_manager.get_candidate_keys()

        if candidate_keys:
            model_sequence = self.model_manager.get_model_sequence(preference=model_preference)

            # MODEL FALLBACK LOOP
            for model_idx, model in enumerate(model_sequence):
                logger.info(f"AI Service attempting model: {model} (rank {model_idx + 1}/{len(model_sequence)})")

                # Re-fetch candidate keys for this model
                keys_to_try = self.key_manager.get_candidate_keys()

                # API KEY FALLBACK LOOP
                for key_status in keys_to_try:
                    retry_count = 0
                    strict_json = False

                    while retry_count <= self.retry_policy.max_retries:
                        total_attempts += 1
                        try:
                            res = self.client.generate(
                                api_key=key_status.key,
                                key_index=key_status.index,
                                model=model,
                                prompt=prompt,
                                system_prompt=system_prompt,
                                schema=schema,
                                is_retry_strict=strict_json,
                                temperature=temperature,
                            )

                            # Success!
                            self.key_manager.mark_success(key_status.index)
                            self.model_manager.record_success(model)

                            total_latency = round(time.time() - start_time, 3)
                            output_data = res.get("structured_data") if schema else res.get("raw_text")

                            return AIResult(
                                status="SUCCESS",
                                data=output_data,
                                raw_text=res.get("raw_text"),
                                provider="openrouter",
                                model_used=model,
                                key_masked=key_status.masked_name,
                                latency=total_latency,
                                attempts=total_attempts,
                                publishable=False,
                            )

                        except OpenRouterException as ore:
                            last_failure_reason = f"[{model}] [{key_status.masked_name}] {ore.failure_type.value}: {str(ore)}"
                            action = self.retry_policy.determine_action(ore.failure_type, retry_count)

                            if action == RetryAction.RETRY_STRICT_JSON:
                                logger.info(f"Retrying with strict JSON enforcement on {model}")
                                strict_json = True
                                retry_count += 1
                                continue

                            elif action == RetryAction.RETRY_SAME:
                                logger.info(f"Temporary failure ({ore.failure_type.value}). Backoff and retry {retry_count + 1}...")
                                self.retry_policy.sleep_backoff(retry_count)
                                retry_count += 1
                                continue

                            elif action == RetryAction.TRY_NEXT_KEY:
                                cooldown = 60.0 if ore.failure_type == FailureType.RATE_LIMIT else 120.0
                                self.key_manager.mark_failure(key_status.index, ore.failure_type.value, cooldown)
                                break  # Break inner retry while loop to move to next key

                            elif action == RetryAction.TRY_NEXT_MODEL:
                                self.model_manager.record_failure(model)
                                break  # Break inner while loop to move to next model

                            else:
                                # Safe fail or unrecoverable error for this key
                                self.key_manager.mark_failure(key_status.index, ore.failure_type.value, 30.0)
                                break

        # Emergency Fallback: If OpenRouter failed or no keys configured, try Gemini if configured
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() and not settings.GEMINI_API_KEY.startswith("your_"):
            logger.info("OpenRouter keys exhausted or unconfigured. Attempting emergency Gemini fallback.")
            total_attempts += 1
            gemini_res = self._try_gemini_fallback(prompt, schema)
            if gemini_res is not None:
                total_latency = round(time.time() - start_time, 3)
                return AIResult(
                    status="SUCCESS",
                    data=gemini_res.get("data"),
                    raw_text=gemini_res.get("raw_text"),
                    provider="gemini_emergency",
                    model_used=settings.GEMINI_MODEL,
                    key_masked="Gemini Key",
                    latency=total_latency,
                    attempts=total_attempts,
                    publishable=False,
                )

        # COMPLETE SAFE FAILURE
        total_latency = round(time.time() - start_time, 3)
        logger.warning(
            f"All AI providers and fallbacks failed after {total_attempts} attempts. "
            f"Routing to LECTURER_REVIEW. Reason: {last_failure_reason}"
        )
        return AIResult(
            status="REVIEW_REQUIRED",
            data=None,
            raw_text=None,
            provider="none",
            model_used=None,
            key_masked=None,
            latency=total_latency,
            attempts=total_attempts,
            failure_reason=last_failure_reason or "AI provider unavailable or not configured",
            publishable=False,
        )

    def _try_gemini_fallback(self, prompt: str, schema: Optional[Type[T]]) -> Optional[Dict[str, Any]]:
        """Invokes the existing Gemini client as an emergency fallback."""
        try:
            from app.services.ai.llm_client import LLMClient
            gemini_client = LLMClient()
            if schema:
                data = gemini_client.generate_structured(prompt, schema)
                return {"data": data, "raw_text": None}
            else:
                text = gemini_client.generate(prompt)
                return {"data": text, "raw_text": text}
        except Exception as e:
            logger.warning(f"Emergency Gemini fallback failed: {e}")
            return None


# Global AI Service instance
ai_service = AIService()
