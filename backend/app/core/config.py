from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "course-shera-api"
    env: str = "dev"

    database_url: str

    gemini_api_key: str | None = None
    gemini_text_model: str = "gemini-2.0-flash"
    gemini_embed_model: str = "gemini-embedding-001"

    storage_dir: str = "./storage"
    public_base_url: str = "http://localhost:8000"


settings = Settings()

