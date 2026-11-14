"""api/routers/marketplace.py - Public marketplace listing endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Query, Response
from schemas.provider import MarketplaceListingDetailResponse, MarketplaceListingListResponse
from services import marketplace as svc

router = APIRouter(prefix="/api", tags=["marketplace"])


@router.get("/marketplace/listings", response_model=MarketplaceListingListResponse)
async def list_marketplace_listings(
    response: Response,
    category: str | None = Query(default=None),
    location: str | None = Query(default=None),
    kind: str | None = Query(default=None),
    availability: str | None = Query(default=None),
    min_price: float | None = Query(default=None),
    max_price: float | None = Query(default=None),
    search: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """Browse public marketplace listings."""
    response.headers["Cache-Control"] = "public, max-age=60"
    items, total = await svc.list_marketplace(
        category=category,
        location=location,
        kind=kind,
        availability=availability,
        min_price=min_price,
        max_price=max_price,
        search=search,
        limit=limit,
        offset=offset,
    )
    return {"items": items, "total": total}


@router.get("/marketplace/listings/{asset_id}", response_model=MarketplaceListingDetailResponse)
async def get_marketplace_listing(
    response: Response,
    asset_id: int,
) -> dict:
    """Retrieve a public marketplace listing's details."""
    response.headers["Cache-Control"] = "public, max-age=60"
    listing = await svc.get_marketplace_listing(asset_id)
    if not listing:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found",
        )
    listing["assets"] = listing.get("assets", [])
    return listing
