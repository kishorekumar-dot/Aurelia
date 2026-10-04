import os
import secrets
from pathlib import Path
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# config.py lives at: backend/app/core/config.py
# .parent.parent.parent resolves to: backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_DIR = BACKEND_DIR.parent  # The workspace root (c:\acadamic-review-ai)
DEFAULT_DB_PATH = (BACKEND_DIR / "academic_review.db").resolve()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AURELIA — Academic Review AI"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False  # Debug mode disabled for security

    # Database: Anchored deterministic path
    DB_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # JWT Authentication & Security
    JWT_SECRET: str = os.environ.get("JWT_SECRET") or os.environ.get("SECRET_KEY") or "aurelia-sec-4f8e21a9c3d7b5601249e0f63a8d1b5c7e92"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # CORS settings: static defaults + runtime-injectable extras
    # Set CORS_EXTRA_ORIGINS in .env as a comma-separated list of URLs to
    # add production / Vercel / staging origins without touching code.
    # Example: CORS_EXTRA_ORIGINS=https://aurelia-abc123.vercel.app,https://yourdomain.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Comma-separated extra origins injected via environment (e.g. Vercel URLs)
    CORS_EXTRA_ORIGINS: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        """Accept either a list or a comma-separated string."""
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    def get_all_cors_origins(self) -> List[str]:
        """Return static defaults merged with any CORS_EXTRA_ORIGINS."""
        extra = [o.strip() for o in self.CORS_EXTRA_ORIGINS.split(",") if o.strip()]
        return list(dict.fromkeys(self.CORS_ORIGINS + extra))  # preserve order, dedupe

    # File Upload Security
    MAX_UPLOAD_SIZE_BYTES: int = 25 * 1024 * 1024  # 25MB limit
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx", ".txt"]
    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_AI_PER_MINUTE: int = 10
    RATE_LIMIT_GENERAL_PER_MINUTE: int = 120

    # LLM config
    LLM_PROVIDER: str = "openrouter"
    LLM_API_KEY: Optional[str] = None
    LLM_ENDPOINT: Optional[str] = "https://api.openai.com/v1/completions"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # OpenRouter LLM Gateway Configuration
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_API_KEY_1: Optional[str] = None
    OPENROUTER_API_KEY_2: Optional[str] = None
    OPENROUTER_API_KEY_3: Optional[str] = None
    OPENROUTER_API_KEY_4: Optional[str] = None
    OPENROUTER_PRIMARY_MODEL: str = "meta-llama/llama-3.1-8b-instruct:free"
    OPENROUTER_FALLBACK_MODEL_1: str = "mistralai/mistral-7b-instruct:free"
    OPENROUTER_FALLBACK_MODEL_2: str = "google/gemma-3-12b-it:free"
    OPENROUTER_MAX_RETRIES: int = 2

    # Tavily Web Search Configuration
    TAVILY_BASE_URL: str = "https://api.tavily.com"
    TAVILY_API_KEY_1: Optional[str] = None
    TAVILY_API_KEY_2: Optional[str] = None
    TAVILY_API_KEY_3: Optional[str] = None
    TAVILY_MAX_RETRIES: int = 2

    # Common AI Timeout
    AI_TIMEOUT_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=str(PROJECT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

