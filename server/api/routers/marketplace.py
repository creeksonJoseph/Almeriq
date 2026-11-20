"""api/routers/marketplace.py - Public marketplace listing endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from schemas.provider import MarketplaceCheckoutRequest, MarketplaceListingDetailResponse, MarketplaceListingListResponse, OrderCreateRequest, OrderResponse
from api.dependencies import get_current_user
from core.db import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from services import order as order_service
from services import deal as deal_service
from services import marketplace as svc

router = APIRouter(prefix="/api", tags=["marketplace"])


@router.post("/marketplace/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_marketplace_order(
    body: OrderCreateRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create an order as an authenticated marketplace buyer."""
    listing = await svc.get_marketplace_listing(body.asset_id)
    if not listing or listing.get("status") != "available":
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing is not available")
    if listing.get("provider_id") is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing provider not found")
    response.headers["Cache-Control"] = "no-store"
    return await order_service.create_order(
        provider_id=listing["provider_id"],
        client_id=current_user["id"],
        asset_id=body.asset_id,
        allocation=body.allocation,
        lease_amount=listing.get("price_monthly"),
        session=db,
    )


@router.post("/marketplace/checkout", status_code=status.HTTP_201_CREATED)
async def create_marketplace_checkout(
    body: MarketplaceCheckoutRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a marketplace order and its deal in one database transaction."""
    from fastapi import HTTPException

    listing = await svc.get_marketplace_listing(body.asset_id)
    if not listing or listing.get("status") != "available":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing is not available",
        )
    if listing.get("provider_id") is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing provider not found",
        )
    if listing.get("price_monthly") is None or float(listing["price_monthly"]) <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This listing does not have a price and cannot be checked out.",
        )

    # The listing price is authoritative; never trust a client-submitted lease amount.
    order = await order_service.create_order(
        provider_id=listing["provider_id"],
        client_id=current_user["id"],
        asset_id=body.asset_id,
        allocation=body.allocation,
        lease_amount=listing["price_monthly"],
        session=db,
    )
    deal = await deal_service.create_deal(
        order_id=order["id"],
        payment_method=body.payment_method,
        amount=float(listing["price_monthly"]),
        client_id=current_user["id"],
        session=db,
    )

    # get_db commits only after this handler returns. Any failure above rolls
    # back both the order and deal, preventing orphaned marketplace orders.
    response.headers["Cache-Control"] = "no-store"
    return {"order": order, "deal": deal}


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
