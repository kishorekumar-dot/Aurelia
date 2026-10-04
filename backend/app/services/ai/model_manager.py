"""
Model Fallback Manager
Manages primary, fallback, and tertiary model sequences.
Model names are fully configurable through environment variables.
"""

import logging
from typing import List, Dict, Optional
from app.core.config import settings

logger = logging.getLogger("aurelia.ai.model_manager")


class ModelManager:
    """
    Maintains a deterministic model fallback sequence.
    Does NOT randomly select models.
    """

    def __init__(
        self,
        primary_model: Optional[str] = None,
        fallback_1: Optional[str] = None,
        fallback_2: Optional[str] = None,
    ):
        self.primary_model = (
            primary_model
            or settings.OPENROUTER_PRIMARY_MODEL
            or "meta-llama/llama-3.1-8b-instruct:free"
        )
        self.fallback_1 = (
            fallback_1
            or settings.OPENROUTER_FALLBACK_MODEL_1
            or "mistralai/mistral-7b-instruct:free"
        )
        self.fallback_2 = (
            fallback_2
            or settings.OPENROUTER_FALLBACK_MODEL_2
            or "google/gemma-3-12b-it:free"
        )

        self._model_stats: Dict[str, Dict[str, int]] = {
            m: {"successes": 0, "failures": 0}
            for m in [self.primary_model, self.fallback_1, self.fallback_2]
        }

    def get_model_sequence(self, preference: str = "primary") -> List[str]:
        """
        Returns the ordered list of models to try.
        Deduplicates if any fallback matches primary.
        """
        if preference == "fallback_1":
            ordered = [self.fallback_1, self.fallback_2, self.primary_model]
        elif preference == "fallback_2":
            ordered = [self.fallback_2, self.fallback_1, self.primary_model]
        else:
            ordered = [self.primary_model, self.fallback_1, self.fallback_2]

        seen = set()
        result = []
        for m in ordered:
            if m and m not in seen:
                seen.add(m)
                result.append(m)
        return result

    def record_success(self, model: str):
        if model not in self._model_stats:
            self._model_stats[model] = {"successes": 0, "failures": 0}
        self._model_stats[model]["successes"] += 1

    def record_failure(self, model: str):
        if model not in self._model_stats:
            self._model_stats[model] = {"successes": 0, "failures": 0}
        self._model_stats[model]["failures"] += 1


model_manager = ModelManager()
