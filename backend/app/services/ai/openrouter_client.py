"""
OpenRouter Client
Handles HTTP calls to OpenRouter API with privacy protection, structured outputs,
and typed error handling.
"""

import time
import json
import uuid
import logging
from typing import Dict, Any, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from app.core.config import settings
from app.services.ai.retry_manager import (
    ErrorClassifier,
    FailureType,
)

logger = logging.getLogger("aurelia.ai.openrouter")
T = TypeVar("T", bound=BaseModel)


class OpenRouterException(Exception):
    def __init__(self, message: str, failure_type: FailureType, status_code: Optional[int] = None):
        super().__init__(message)
        self.failure_type = failure_type
        self.status_code = status_code


class OpenRouterClient:
    """
    Direct low-level client for OpenRouter API.
    Enforces privacy by stripping keys from logs and messages.
    """

    def __init__(self, base_url: Optional[str] = None, timeout_seconds: Optional[int] = None):
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).rstrip("/")
        self.timeout = float(timeout_seconds or settings.AI_TIMEOUT_SECONDS)

    def generate(
        self,
        api_key: str,
        key_index: int,
        model: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        schema: Optional[Type[T]] = None,
        is_retry_strict: bool = False,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:
        """
        Executes a completion request against OpenRouter.
        Logs safely (request_id, model, key_index, latency, status).
        """
        request_id = f"req-{uuid.uuid4().hex[:8]}"
        start_time = time.time()

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        user_content = prompt
        if schema is not None:
            schema_json = json.dumps(schema.model_json_schema(), indent=2)
            if is_retry_strict:
                user_content += (
                    f"\n\nCRITICAL INSTRUCTION: Your response MUST be valid JSON adhering strictly "
                    f"to the following schema. Return ONLY raw JSON without markdown code fences or conversational text:\n{schema_json}"
                )
            else:
                user_content += (
                    f"\n\nRespond with a valid JSON object matching the following schema:\n{schema_json}"
                )

        messages.append({"role": "user", "content": user_content})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://aurelia-academic-review.local",
            "X-Title": "Aurelia Academic Review AI",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        # Enable response format json_object if supported
        if schema is not None:
            payload["response_format"] = {"type": "json_object"}

        url = f"{self.base_url}/chat/completions"

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, json=payload, headers=headers)
                latency = round(time.time() - start_time, 3)

                if resp.status_code != 200:
                    fail_type = ErrorClassifier.classify_http_error(resp.status_code, resp.text)
                    logger.warning(
                        f"OpenRouter request failed [ID={request_id}] [Model={model}] "
                        f"[KeyIndex={key_index}] [Status={resp.status_code}] "
                        f"[Type={fail_type.value}] [Latency={latency}s]"
                    )
                    raise OpenRouterException(
                        f"OpenRouter API error {resp.status_code}: {fail_type.value}",
                        failure_type=fail_type,
                        status_code=resp.status_code,
                    )

                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise OpenRouterException(
                        "OpenRouter returned empty choices",
                        failure_type=FailureType.MALFORMED_RESPONSE,
                        status_code=200,
                    )

                raw_text = choices[0].get("message", {}).get("content", "")
                
                parsed_schema_obj = None
                if schema is not None:
                    # Clean markdown blocks if LLM wrapped output in ```json ... ```
                    clean_text = raw_text.strip()
                    if clean_text.startswith("```"):
                        lines = clean_text.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].strip() == "```":
                            lines = lines[:-1]
                        clean_text = "\n".join(lines).strip()

                    try:
                        parsed_schema_obj = schema.model_validate_json(clean_text)
                    except (ValidationError, json.JSONDecodeError) as parse_err:
                        logger.warning(
                            f"JSON validation error [ID={request_id}] [Model={model}] [KeyIndex={key_index}]: {parse_err}"
                        )
                        raise OpenRouterException(
                            f"Invalid structured output: {str(parse_err)}",
                            failure_type=FailureType.INVALID_STRUCTURED_OUTPUT,
                            status_code=200,
                        )

                logger.info(
                    f"OpenRouter request success [ID={request_id}] [Model={model}] "
                    f"[KeyIndex={key_index}] [Latency={latency}s]"
                )

                return {
                    "request_id": request_id,
                    "model_used": model,
                    "key_index": key_index,
                    "latency": latency,
                    "raw_text": raw_text,
                    "structured_data": parsed_schema_obj,
                    "status": "SUCCESS",
                }

        except httpx.TimeoutException as te:
            latency = round(time.time() - start_time, 3)
            logger.warning(
                f"OpenRouter timeout [ID={request_id}] [Model={model}] "
                f"[KeyIndex={key_index}] [Latency={latency}s]"
            )
            raise OpenRouterException("Request timed out", failure_type=FailureType.TIMEOUT)
        except httpx.NetworkError as ne:
            latency = round(time.time() - start_time, 3)
            logger.warning(
                f"OpenRouter network error [ID={request_id}] [Model={model}] "
                f"[KeyIndex={key_index}] [Latency={latency}s]"
            )
            raise OpenRouterException(
                "Network connection failed", failure_type=FailureType.CONNECTION_FAILURE
            )
        except OpenRouterException:
            raise
        except Exception as ex:
            fail_type = ErrorClassifier.classify_exception(ex)
            latency = round(time.time() - start_time, 3)
            logger.error(
                f"OpenRouter unexpected error [ID={request_id}] [Model={model}] "
                f"[KeyIndex={key_index}] [Type={fail_type.value}] [Latency={latency}s]"
            )
            raise OpenRouterException(str(ex), failure_type=fail_type)


openrouter_client = OpenRouterClient()
