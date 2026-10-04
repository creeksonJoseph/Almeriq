"""core/config.py — singleton settings loaded once at startup."""
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
