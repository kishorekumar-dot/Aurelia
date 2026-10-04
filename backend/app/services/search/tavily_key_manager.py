"""
Tavily Key Manager
Provides deterministic sequential key fallback for Tavily API,
cooldown tracking, and privacy enforcement.
"""

import time
import logging
from typing import List, Optional
from dataclasses import dataclass
from app.core.config import settings

logger = logging.getLogger("aurelia.search.key_manager")


@dataclass
class TavilyKeyStatus:
    index: int  # 1-indexed
    key: str
    failure_count: int = 0
    last_failure_time: float = 0.0
    last_error_type: Optional[str] = None
    is_active: bool = True
    cooldown_seconds: float = 60.0
    total_successes: int = 0

    @property
    def is_in_cooldown(self) -> bool:
        if self.last_failure_time == 0:
            return False
        return (time.time() - self.last_failure_time) < self.cooldown_seconds

    @property
    def masked_name(self) -> str:
        return f"Tavily Key #{self.index}"


class TavilyKeyManager:
    """Manages multiple Tavily API keys with controlled sequential fallback."""

    def __init__(self, keys: Optional[List[str]] = None):
        self._keys: List[TavilyKeyStatus] = []
        self._initialize_keys(keys)

    def _initialize_keys(self, custom_keys: Optional[List[str]] = None):
        if custom_keys is not None:
            raw_keys = [k.strip() for k in custom_keys if k and k.strip()]
        else:
            raw_keys = []
            for i in range(1, 10):
                k = getattr(settings, f"TAVILY_API_KEY_{i}", None)
                if k and k.strip() and not k.startswith("your_"):
                    raw_keys.append(k.strip())

        self._keys = [
            TavilyKeyStatus(index=i + 1, key=key)
            for i, key in enumerate(raw_keys)
        ]
        logger.info(f"Initialized TavilyKeyManager with {len(self._keys)} key(s).")

    @property
    def has_keys(self) -> bool:
        return len(self._keys) > 0

    def get_candidate_keys(self) -> List[TavilyKeyStatus]:
        """Returns active keys not in cooldown, or active keys sorted by cooldown."""
        if not self._keys:
            return []

        available = [k for k in self._keys if k.is_active and not k.is_in_cooldown]
        if available:
            return available

        cooling = [k for k in self._keys if k.is_active]
        cooling.sort(key=lambda k: k.last_failure_time + k.cooldown_seconds)
        return cooling

    def mark_success(self, key_index: int):
        for k in self._keys:
            if k.index == key_index:
                k.total_successes += 1
                k.failure_count = 0
                k.last_failure_time = 0.0
                k.last_error_type = None
                break

    def mark_failure(self, key_index: int, error_type: str, cooldown_seconds: float = 60.0):
        for k in self._keys:
            if k.index == key_index:
                k.failure_count += 1
                k.last_failure_time = time.time()
                k.last_error_type = error_type
                k.cooldown_seconds = cooldown_seconds

                if error_type in ("AUTH_FAILURE", "INVALID_API_KEY"):
                    k.is_active = False
                    logger.warning(f"{k.masked_name} marked INACTIVE due to {error_type}.")
                else:
                    logger.warning(
                        f"{k.masked_name} cooldown ({cooldown_seconds}s) due to {error_type}."
                    )
                break


tavily_key_manager = TavilyKeyManager()
