"""
Search Service
Central coordinator for external web search using Tavily with key fallback.
Never fabricates search results when provider is unavailable.
"""

import logging
from typing import Dict, Any, List, Optional
from app.services.search.tavily_key_manager import tavily_key_manager, TavilyKeyManager
from app.services.search.tavily_client import tavily_client, TavilyClient

logger = logging.getLogger("aurelia.search.service")


class SearchService:
    """High-level search service used by specialized agents."""

    def __init__(
        self,
        key_manager: Optional[TavilyKeyManager] = None,
        client: Optional[TavilyClient] = None,
    ):
        self.key_manager = key_manager or tavily_key_manager
        self.client = client or tavily_client

    def search(
        self,
        query: str,
        max_results: int = 4,
        search_depth: str = "basic"
    ) -> Dict[str, Any]:
        """
        Executes web search with sequential key fallback.
        Returns:
            {
                "status": "SUCCESS" | "SEARCH_UNAVAILABLE",
                "query": query,
                "sources": [ ... ],
                "key_used": <masked_name> | None,
                "reason": str (if unavailable)
            }
        """
        # Safety check: clean query
        clean_query = query.strip()
        if not clean_query:
            return {
                "status": "SEARCH_UNAVAILABLE",
                "query": "",
                "sources": [],
                "reason": "Empty search query",
            }

        candidates = self.key_manager.get_candidate_keys()
        if not candidates:
            logger.info("No Tavily API keys configured. Returning SEARCH_UNAVAILABLE.")
            return {
                "status": "SEARCH_UNAVAILABLE",
                "query": clean_query,
                "sources": [],
                "reason": "Tavily search provider not configured or all keys exhausted",
            }

        for key_status in candidates:
            logger.info(f"Attempting web search with {key_status.masked_name} for query: '{clean_query[:60]}...'")
            result = self.client.search(
                api_key=key_status.key,
                key_index=key_status.index,
                query=clean_query,
                max_results=max_results,
                search_depth=search_depth,
            )

            if result.get("status") == "SUCCESS":
                self.key_manager.mark_success(key_status.index)
                return {
                    "status": "SUCCESS",
                    "query": clean_query,
                    "sources": result.get("results", []),
                    "key_used": key_status.masked_name,
                    "latency": result.get("latency", 0.0),
                }

            # Failure on this key - mark and continue to next key
            error_type = result.get("error_type", "UNKNOWN_ERROR")
            cooldown = 120.0 if error_type in ("RATE_LIMIT", "QUOTA_EXHAUSTED") else 30.0
            self.key_manager.mark_failure(key_status.index, error_type, cooldown_seconds=cooldown)

        # All keys failed
        logger.warning(f"All Tavily keys failed for query '{clean_query[:60]}'. Safe fallback.")
        return {
            "status": "SEARCH_UNAVAILABLE",
            "query": clean_query,
            "sources": [],
            "reason": "Search provider unavailable: all search keys failed or timed out. External verification skipped.",
        }


# Global instance
search_service = SearchService()
