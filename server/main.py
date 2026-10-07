"""
main.py - App factory, middleware registration, lifespan.

Follows fullstack-performance-architecture §1, §5, §6, §7.
Layers: main → api/routers → services → repositories → core
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware  # §7.1

from sqlalchemy import text
from core.db import engine, close_db
from models import Base
from api.routers.waitlist import router as waitlist_router
from api.routers.health import router as health_router
from api.routers.auth import router as auth_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")


# ── DB schema bootstrap ───────────────────────────────────────────────────────
async def _ensure_schema() -> None:
    """
    Fallback schema bootstrap for local dev.
    In production, migrations run via Alembic in preDeployCommand.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("""
            ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password TEXT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS id_number TEXT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT NULL;
            ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        """))


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await _ensure_schema()
    yield
    await close_db()


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    lifespan=lifespan,
    title="ALIMERIQ API",
    description="Waitlist & Authentication API for ALIMERIQ.",
    version="0.1.0",
)

# §7.1 - GZip: typically cuts JSON 60-80%
app.add_middleware(GZipMiddleware, minimum_size=500)

from core.config import ALLOWED_ORIGINS

# CORS - dynamic allowed origins from environment (defaults to allow all or specified domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(waitlist_router)
app.include_router(auth_router)


