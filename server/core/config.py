"""core/config.py - singleton settings loaded once at startup."""
from __future__ import annotations
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.environ["DATABASE_URL"]
RESEND_API_KEY: str = os.environ.get("RESEND_API_KEY") or os.environ.get("resend_api_key", "")
DOMAIN: str = os.environ.get("DOMAIN") or os.environ.get("domain", "alimeriq.app")
ALLOWED_ORIGINS: list[str] = [
    o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",") if o.strip()
]

# Authentication & Security settings
JWT_SECRET_KEY: str = os.environ.get(
    "JWT_SECRET_KEY",
)
JWT_ALGORITHM: str = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.environ.get("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
)  # 7 days default
COOKIE_NAME: str = os.environ.get("COOKIE_NAME", "auth_token")
COOKIE_SECURE: bool = os.environ.get("COOKIE_SECURE", "true").lower() in ("true", "1", "yes")
COOKIE_SAMESITE: str = os.environ.get("COOKIE_SAMESITE", "lax")
