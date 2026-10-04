"""
Tavily Search Client
Handles HTTP calls to Tavily API with key fallback, error classification,
and source extraction.
"""

import time
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings
from app.services.ai.retry_manager import ErrorClassifier, FailureType

logger = logging.getLogger("aurelia.search.tavily")


class TavilyClient:
    """Low-level Tavily API client."""

    def __init__(self, base_url: Optional[str] = None, timeout_seconds: Optional[int] = None):
        self.base_url = (base_url or settings.TAVILY_BASE_URL).rstrip("/")
        self.timeout = float(timeout_seconds or settings.AI_TIMEOUT_SECONDS)

    def search(
        self,
        api_key: str,
        key_index: int,
        query: str,
        max_results: int = 5,
        search_depth: str = "basic",
    ) -> Dict[str, Any]:
        """
        Executes search via Tavily API.
        Never logs the API key or raw document text.
        """
        request_id = f"tav-{uuid.uuid4().hex[:8]}"
        start_time = time.time()
        url = f"{self.base_url}/search"

        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "include_answer": False,
            "include_raw_content": False,
        }

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, json=payload)
                latency = round(time.time() - start_time, 3)

                if resp.status_code != 200:
                    fail_type = ErrorClassifier.classify_http_error(resp.status_code, resp.text)
                    logger.warning(
                        f"Tavily request failed [ID={request_id}] [KeyIndex={key_index}] "
                        f"[Status={resp.status_code}] [Type={fail_type.value}] [Latency={latency}s]"
                    )
                    return {
                        "status": "ERROR",
                        "error_type": fail_type.value,
                        "status_code": resp.status_code,
                        "query": query,
                        "results": [],
                    }

                data = resp.json()
                raw_results = data.get("results", [])
                formatted_sources: List[Dict[str, Any]] = []
                now_iso = datetime.now(timezone.utc).isoformat()

                for r in raw_results:
                    formatted_sources.append({
                        "title": r.get("title") or "Source",
                        "url": r.get("url") or "",
                        "snippet": r.get("content") or "",
                        "score": r.get("score", 0.0),
                        "retrieval_timestamp": now_iso,
                    })

                logger.info(
                    f"Tavily search success [ID={request_id}] [KeyIndex={key_index}] "
                    f"[Results={len(formatted_sources)}] [Latency={latency}s]"
                )

                return {
                    "status": "SUCCESS",
                    "query": query,
                    "results": formatted_sources,
                    "key_index": key_index,
                    "latency": latency,
                }

        except httpx.TimeoutException:
            logger.warning(f"Tavily timeout [ID={request_id}] [KeyIndex={key_index}]")
            return {
                "status": "ERROR",
                "error_type": FailureType.TIMEOUT.value,
                "query": query,
                "results": [],
            }
        except httpx.NetworkError:
            logger.warning(f"Tavily network error [ID={request_id}] [KeyIndex={key_index}]")
            return {
                "status": "ERROR",
                "error_type": FailureType.CONNECTION_FAILURE.value,
                "query": query,
                "results": [],
            }
        except Exception as e:
            logger.error(f"Tavily unexpected error [ID={request_id}] [KeyIndex={key_index}]: {e}")
            return {
                "status": "ERROR",
                "error_type": FailureType.UNEXPECTED_ERROR.value,
                "query": query,
                "results": [],
            }


tavily_client = TavilyClient()
