"""api/routers/health.py - Health check endpoints for uptime monitoring & Render keep-alive."""
from __future__ import annotations

from datetime import datetime, timezone
from fastapi import APIRouter, Response
from sqlalchemy import text
from core.db import engine

router = APIRouter(tags=["ops"])


async def _get_health_status() -> dict:
    timestamp = datetime.now(timezone.utc).isoformat()
    db_status = "unknown"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as err:
        db_status = f"unreachable: {str(err)}"

    is_healthy = db_status == "connected"
    return {
        "status": "healthy" if is_healthy else "degraded",
        "service": "alimeriq-api",
        "timestamp": timestamp,
        "database": db_status,
    }


@router.get("/health")
@router.head("/health")
@router.get("/api/health")
@router.head("/api/health")
async def health_check(response: Response) -> dict:
    """
    Public health check endpoint available at `/health` and `/api/health`.

    Cache-Control headers are set to prevent CDNs, edge proxies, or browsers
    from caching the response, ensuring every cron ping hits the Render web service
    container directly to prevent it from going to sleep.
    """
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    return await _get_health_status()
