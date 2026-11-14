"""services/search.py - Business logic for public search."""
from __future__ import annotations
import logging
from services import asset as asset_service

logger = logging.getLogger(__name__)


async def search(
    q: str | None = None,
    category: str | None = None,
    location: str | None = None,
    kind: str | None = None,
    availability: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Search public marketplace listings/assets."""
    return await asset_service.search_assets(
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
