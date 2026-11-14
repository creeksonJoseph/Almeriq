"""api/routers/search.py - Public search endpoint."""
from __future__ import annotations

from fastapi import APIRouter, Query, Response
from schemas.provider import SearchResultResponse
from services import search as svc

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/search", response_model=SearchResultResponse)
async def search_listings(
    response: Response,
    q: str | None = Query(default=None),
    category: str | None = Query(default=None),
    location: str | None = Query(default=None),
    kind: str | None = Query(default=None),
    availability: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Search public marketplace listings/assets."""
    response.headers["Cache-Control"] = "public, max-age=60"
    items, total = await svc.search(
        q=q,
        category=category,
        location=location,
        kind=kind,
        availability=availability,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "total": total}
