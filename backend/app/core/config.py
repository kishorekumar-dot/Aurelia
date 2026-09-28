from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AcademicReview AI"
    API_V1_STR: str = "/api"
    # Database
    DB_URL: str = "sqlite:///./academic_review.db"
    # LLM config
    LLM_PROVIDER: str = "openai"
    LLM_API_KEY: str = "your_openai_api_key"
    LLM_ENDPOINT: str = "https://api.openai.com/v1/completions"

    class Config:
        env_file = ".env"

settings = Settings()
