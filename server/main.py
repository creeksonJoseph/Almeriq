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

from core.db import close_db
from api.routers.waitlist import router as waitlist_router
from api.routers.health import router as health_router
from api.routers.auth import router as auth_router
from api.routers.founder import router as founder_router
from api.routers.admin import router as admin_router
from api.routers.provider import router as provider_router
from api.routers.asset import router as asset_router
from api.routers.coverage import router as coverage_router
from api.routers.marketplace import router as marketplace_router
from api.routers.search import router as search_router
from api.routers.order import router as order_router
from api.routers.deal import router as deal_router
from api.routers.conversation import router as conversation_router
from api.routers.message import router as message_router
from api.routers.notification import router as notification_router

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s - %(message)s")


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
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

is_wildcard = "*" in ALLOWED_ORIGINS or ALLOWED_ORIGINS == ["*"]

# CORS - supports credentials safely even if wildcard origin is provided in config
app.add_middleware(
    CORSMiddleware,
    allow_origins=[] if is_wildcard else ALLOWED_ORIGINS,
    allow_origin_regex=r"^https?://.*" if is_wildcard else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health_router)
app.include_router(waitlist_router)
app.include_router(auth_router)
app.include_router(founder_router)
app.include_router(admin_router)
app.include_router(provider_router)
app.include_router(asset_router)
app.include_router(coverage_router)
app.include_router(marketplace_router)
app.include_router(search_router)
app.include_router(order_router)
app.include_router(deal_router)
app.include_router(conversation_router)
app.include_router(message_router)
app.include_router(notification_router)

