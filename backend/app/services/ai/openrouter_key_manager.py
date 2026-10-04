"""
OpenRouter API Key Manager
Provides controlled sequential API key fallback, cooldown tracking,
and strict privacy enforcement (keys are never logged or exposed).
"""

import time
import logging
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, field
from app.core.config import settings

logger = logging.getLogger("aurelia.ai.key_manager")


@dataclass
class KeyStatus:
    index: int  # 1-indexed (Key 1, Key 2, ...)
    key: str
    failure_count: int = 0
    last_failure_time: float = 0.0
    last_error_type: Optional[str] = None
    is_active: bool = True
    cooldown_seconds: float = 60.0
    total_successes: int = 0
    total_failures: int = 0

    @property
    def is_in_cooldown(self) -> bool:
        if self.last_failure_time == 0:
            return False
        return (time.time() - self.last_failure_time) < self.cooldown_seconds

    @property
    def masked_name(self) -> str:
        return f"OpenRouter Key #{self.index}"


class OpenRouterKeyManager:
    """
    Manages multiple OpenRouter API keys with deterministic sequential fallback.
    Never rotates randomly.
    """

    def __init__(self, keys: Optional[List[str]] = None):
        self._keys: List[KeyStatus] = []
        self._initialize_keys(keys)

    def _initialize_keys(self, custom_keys: Optional[List[str]] = None):
        if custom_keys is not None:
            raw_keys = [k.strip() for k in custom_keys if k and k.strip()]
        else:
            # Discover from settings
            raw_keys = []
            for i in range(1, 10):
                k = getattr(settings, f"OPENROUTER_API_KEY_{i}", None)
                if k and k.strip() and not k.startswith("your_"):
                    raw_keys.append(k.strip())
            
            # Fallback to general LLM_API_KEY if configured and looks like openrouter key
            if not raw_keys and settings.LLM_API_KEY and settings.LLM_PROVIDER == "openrouter":
                raw_keys.append(settings.LLM_API_KEY.strip())

        self._keys = [
            KeyStatus(index=i + 1, key=key)
            for i, key in enumerate(raw_keys)
        ]
        logger.info(f"Initialized OpenRouterKeyManager with {len(self._keys)} key(s).")

    @property
    def total_keys(self) -> int:
        return len(self._keys)

    def has_keys(self) -> bool:
        return len(self._keys) > 0

    def get_available_key_statuses(self) -> List[KeyStatus]:
        """Returns all keys that are active and not in cooldown."""
        now = time.time()
        return [
            k for k in self._keys
            if k.is_active and not k.is_in_cooldown
        ]

    def get_candidate_keys(self) -> List[KeyStatus]:
        """
        Returns keys in deterministic sequence.
        Prioritizes non-cooldown keys first, followed by cooldown keys ordered by expiry.
        """
        if not self._keys:
            return []

        available = [k for k in self._keys if k.is_active and not k.is_in_cooldown]
        if available:
            return available

        # If all keys are in cooldown, sort by remaining cooldown time
        cooling = [k for k in self._keys if k.is_active]
        cooling.sort(key=lambda k: k.last_failure_time + k.cooldown_seconds)
        return cooling

    def mark_success(self, key_index: int):
        """Record successful request for the given key index."""
        for k in self._keys:
            if k.index == key_index:
                k.total_successes += 1
                k.failure_count = 0
                k.last_failure_time = 0.0
                k.last_error_type = None
                break

    def mark_failure(self, key_index: int, error_type: str, cooldown_seconds: float = 60.0):
        """
        Record failure and place key into temporary cooldown.
        Error types: RATE_LIMIT, QUOTA_EXHAUSTION, AUTH_FAILURE, TIMEOUT, etc.
        """
        for k in self._keys:
            if k.index == key_index:
                k.total_failures += 1
                k.failure_count += 1
                k.last_failure_time = time.time()
                k.last_error_type = error_type
                k.cooldown_seconds = cooldown_seconds

                if error_type in ("AUTH_FAILURE", "INVALID_KEY"):
                    k.is_active = False
                    logger.warning(f"{k.masked_name} marked INACTIVE due to {error_type}.")
                else:
                    logger.warning(
                        f"{k.masked_name} placed on cooldown ({cooldown_seconds}s) "
                        f"due to {error_type}. Fail count: {k.failure_count}."
                    )
                break

    def reset_cooldowns(self):
        """Reset cooldowns on all active keys."""
        for k in self._keys:
            if k.is_active:
                k.last_failure_time = 0.0
                k.failure_count = 0


# Global singleton instance
openrouter_key_manager = OpenRouterKeyManager()
