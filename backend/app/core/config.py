from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MyPace API"
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    database_url: str = "sqlite:///./mypace.db"
    supabase_url: str = ""
    supabase_jwt_issuer: str = ""
    openai_api_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
