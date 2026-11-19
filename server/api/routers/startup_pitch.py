"""api/routers/startup_pitch.py - Startup pitch listings (public read)."""
from __future__ import annotations

from fastapi import APIRouter, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from core.db import get_db
from repositories import startup_pitch as svc

router = APIRouter(prefix="/api", tags=["startup-pitches"])


@router.get("/startup-pitches")
async def list_startup_pitches(
    response: Response,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """List startup pitches, newest first. Public read."""
    response.headers["Cache-Control"] = "public, max-age=30"
    pitches = await svc.list_startup_pitches(session=db)
    sliced = pitches[offset : offset + limit]
    return {"items": sliced, "total": len(pitches)}
