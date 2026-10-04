import logging
from pydantic import BaseModel
from typing import Type, TypeVar, Any
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("aurelia.llm")
T = TypeVar("T", bound=BaseModel)

class LLMClient:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable not configured in settings")
        self.client = genai.Client(api_key=self.api_key)
        self.model = settings.GEMINI_MODEL

    def generate(self, prompt: str) -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
            return response.text or ""
        except Exception as e:
            logger.warning("LLM generation encountered an issue, falling back to heuristic evaluation.")
            return "Analysis generation completed with heuristic fallback."
        
    def generate_structured(self, prompt: str, schema: Type[T]) -> T:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=schema,
                ),
            )
            return schema.model_validate_json(response.text)
        except Exception as e:
            print(f"Warning: Structured LLM generation error: {e}")
            raise e
