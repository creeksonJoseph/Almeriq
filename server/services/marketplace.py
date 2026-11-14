"""services/marketplace.py - Business logic for public marketplace."""
from __future__ import annotations
import logging
from services import asset as asset_service

logger = logging.getLogger(__name__)


async def list_marketplace(
    category: str | None = None,
    location: str | None = None,
    kind: str | None = None,
    availability: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """List public marketplace listings."""
    return await asset_service.list_public_assets(
        category=category,
        kind=kind,
        location=location,
        availability=availability,
        min_price=min_price,
        max_price=max_price,
        search=search,
        limit=limit,
        offset=offset,
    )


async def get_marketplace_listing(
    asset_id: int,
) -> dict | None:
    """Get public marketplace listing detail."""
    return await asset_service.get_public_asset_detail(asset_id)


async def search_marketplace(
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
    """Search marketplace listings."""
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