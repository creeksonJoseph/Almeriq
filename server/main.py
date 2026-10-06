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

from core.db import init_pool, close_pool, get_pool
from api.routers.waitlist import router as waitlist_router
from api.routers.health import router as health_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")


# ── DB schema bootstrap ───────────────────────────────────────────────────────
async def _ensure_schema() -> None:
    """
    Create the waitlist table if absent and ensure all required indexes exist.
    §2 Indexes:
      - email UNIQUE → implicit B-tree index (covers equality seeks).
      - joined_at   → explicit B-tree for chronological sorts / dashboard queries.
    In production, migrate via Alembic; this is the no-extra-infra fallback.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS waitlist (
                id          SERIAL       PRIMARY KEY,
                full_name   TEXT         NOT NULL,
                email       TEXT         NOT NULL UNIQUE,    -- B-tree index via UNIQUE
                role        TEXT         NOT NULL,
                joined_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
            );

            -- §2: index the sort column used in ORDER BY joined_at DESC queries
            CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at
                ON waitlist (joined_at DESC);
        """)


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_pool()
    await _ensure_schema()
    yield
    await close_pool()


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    lifespan=lifespan,
    title="ALIMERIQ API",
    description="Waitlist API for ALIMERIQ - the platform connecting founders, investors, job seekers and infrastructure providers.",
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

