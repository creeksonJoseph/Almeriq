"""Public startup pitch discovery - published pitches only."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import get_db
from repositories import startup_pitch as repo

router = APIRouter(prefix="/api", tags=["startup-pitches"])


@router.get("/startup-pitches")
async def list_startup_pitches(
    response: Response,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Return only pitches explicitly published by their founders."""
    response.headers["Cache-Control"] = "public, max-age=30"
    items = await repo.list_startup_pitches(
        limit=limit, offset=offset, published_only=True, session=db
    )
    total = await repo.count_startup_pitches(published_only=True, session=db)
    return {"items": items, "total": total}
