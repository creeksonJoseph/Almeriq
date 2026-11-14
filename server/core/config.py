"""core/config.py - Application settings via pydantic-settings (BaseSettings)."""
from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application configuration loaded from environment variables and .env files."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./almeriq_dev.db"

    # Resend
    RESEND_API_KEY: str = ""
    DOMAIN: str = "alimeriq.app"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]

    # Auth / Security
    JWT_SECRET_KEY: str = "generate_a_random_32_byte_secret_key_here"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    COOKIE_NAME: str = "auth_token"
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Upstash Redis
    UPSTASH_REDIS_URL: str = ""
    UPSTASH_REDIS_TOKEN: str = ""

    # Gemini
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"


settings = Settings()

# Export individual settings for backward compatibility
DATABASE_URL = settings.DATABASE_URL
RESEND_API_KEY = settings.RESEND_API_KEY
DOMAIN = settings.DOMAIN
ALLOWED_ORIGINS = settings.ALLOWED_ORIGINS
JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = settings.JWT_ALGORITHM
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
COOKIE_NAME = settings.COOKIE_NAME
COOKIE_SECURE = settings.COOKIE_SECURE
COOKIE_SAMESITE = settings.COOKIE_SAMESITE
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
UPSTASH_REDIS_URL = settings.UPSTASH_REDIS_URL
UPSTASH_REDIS_TOKEN = settings.UPSTASH_REDIS_TOKEN
GEMINI_API_KEY = settings.GEMINI_API_KEY
GEMINI_MODEL = settings.GEMINI_MODEL