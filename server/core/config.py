"""core/config.py - Application settings via pydantic-settings (BaseSettings)."""
from __future__ import annotations

import json
from typing import Annotated, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables and .env files."""

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.dev", ".env.prod"),
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
    ALLOWED_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: object) -> object:
        if not isinstance(value, str):
            return value

        value = value.strip()
        if not value:
            return []

        if value.startswith("["):
            try:
                decoded = json.loads(value)
            except json.JSONDecodeError:
                pass
            else:
                if isinstance(decoded, list):
                    return [str(origin).strip() for origin in decoded if str(origin).strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]

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

    # Cloudinary media storage
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # Sentry
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 1.0
    SENTRY_PROFILES_SAMPLE_RATE: float = 0.0


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
CLOUDINARY_CLOUD_NAME = settings.CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY = settings.CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET = settings.CLOUDINARY_API_SECRET
SENTRY_DSN = settings.SENTRY_DSN
SENTRY_ENVIRONMENT = settings.SENTRY_ENVIRONMENT
SENTRY_TRACES_SAMPLE_RATE = settings.SENTRY_TRACES_SAMPLE_RATE
SENTRY_PROFILES_SAMPLE_RATE = settings.SENTRY_PROFILES_SAMPLE_RATE