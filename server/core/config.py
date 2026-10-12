"""core/config.py - singleton settings loaded strictly from environment without fallbacks."""
from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly load .env from the server root directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Strict Environment Variable Lookups (raises KeyError if missing from .env)
DATABASE_URL: str = os.environ["DATABASE_URL"]
RESEND_API_KEY: str = os.environ["RESEND_API_KEY"]
DOMAIN: str = os.environ["DOMAIN"]

ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.environ["ALLOWED_ORIGINS"].split(",") if o.strip()
]

# Authentication & Security Settings
JWT_SECRET_KEY: str = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
)
COOKIE_NAME: str = os.environ["COOKIE_NAME"]
COOKIE_SECURE: bool = os.environ["COOKIE_SECURE"].lower() in ("true", "1", "yes")
COOKIE_SAMESITE: str = os.environ["COOKIE_SAMESITE"]

# Google OAuth Credentials (Empty string until user adds them to server/.env)
GOOGLE_CLIENT_ID: str = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET: str = os.environ.get("GOOGLE_CLIENT_SECRET", "")

# Upstash Redis (optional - falls back to in-memory if not set)
UPSTASH_REDIS_URL: str = os.environ.get("UPSTASH_REDIS_URL", "")
UPSTASH_REDIS_TOKEN: str = os.environ.get("UPSTASH_REDIS_TOKEN", "")

# Founder AI analysis. Keep this key server-side; never expose it to the browser.
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")
