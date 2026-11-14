"""api/routers/order.py - Provider order endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_provider_profile
from schemas.provider import (
    OrderCreateRequest,
    OrderDetailResponse,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdateRequest,
    WaybillUploadRequest,
    WaybillResponse,
)
from services import order as svc

router = APIRouter(prefix="/api", tags=["orders"])


@router.post("/provider/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    response: Response,
    body: OrderCreateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create an order for one of the provider's assets."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_order(
        provider_id=profile["id"],
        client_id=profile["user_id"],
        asset_id=body.asset_id,
        allocation=body.allocation,
        lease_amount=body.lease_amount,
        session=db,
    )


@router.get("/provider/orders", response_model=OrderListResponse)
async def list_orders(
    response: Response,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(default=None),
) -> dict:
    """List orders for the current provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items, total = await svc.list_orders(
        provider_id=profile["id"],
        status=status,
        session=db,
    )
    return {"items": items, "total": total}


@router.get("/provider/orders/{order_id}", response_model=OrderDetailResponse)
async def get_order(
    response: Response,
    order_id: int,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve an order owned by the current provider, with events."""
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_order(order_id=order_id, provider_id=profile["id"], session=db)


@router.patch("/provider/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    response: Response,
    order_id: int,
    body: OrderStatusUpdateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update an order's status (ownership check)."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.update_order_status(
        order_id=order_id,
        provider_id=profile["id"],
        new_status=body.status,
        actor_id=profile["id"],
        session=db,
    )


@router.get("/provider/orders/{order_id}/waybill", response_model=WaybillResponse)
async def get_waybill(
    response: Response,
    order_id: int,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_waybill(order_id=order_id, provider_id=profile["id"], session=db)


@router.post("/provider/orders/{order_id}/waybill", response_model=OrderResponse)
async def upload_waybill(
    response: Response,
    order_id: int,
    body: WaybillUploadRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Record a waybill upload for an order owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.upload_waybill(
        order_id=order_id,
        provider_id=profile["id"],
        waybill_url=body.waybill_url,
        tracking_number=body.tracking_number,
        actor_id=profile["id"],
        session=db,
    )
