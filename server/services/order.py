"""services/order.py - Business logic for orders."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import order as order_repo
from repositories import order_event as order_event_repo

logger = logging.getLogger(__name__)


async def list_orders(
    provider_id: int,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List orders for a provider."""
    return await order_repo.list_orders(
        provider_id=provider_id,
        status=status,
        limit=limit,
        offset=offset,
        session=session,
    )


async def create_order(
    provider_id: int,
    client_id: int,
    asset_id: int,
    allocation: str | None = None,
    lease_amount: float | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new order for a provider's asset."""
    import uuid
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    return await order_repo.create_order(
        order_id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        asset_id=asset_id,
        allocation=allocation,
        lease_amount=lease_amount,
        session=session,
    )


async def get_order(
    order_id: int,
    provider_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get an order by ID (ownership check). Includes related events."""
    order = await order_repo.get_order_by_id(order_id, provider_id=provider_id, session=session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    events = await order_event_repo.list_order_events(order_id, session=session)
    order["events"] = events
    return order


async def update_order_status(
    order_id: int,
    provider_id: int,
    new_status: str,
    actor_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Update an order's status (ownership check) and record an event."""
    order = await order_repo.update_order_status(
        order_id, provider_id, new_status, session=session
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if actor_id is not None:
        await order_event_repo.create_order_event(
            order_id=order["id"],
            event_type="status_changed",
            actor_id=actor_id,
            note=f"Order status updated to {new_status}",
            session=session,
        )
    return order


async def upload_waybill(
    order_id: int,
    provider_id: int,
    waybill_url: str,
    tracking_number: str | None = None,
    actor_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Record a waybill upload for an order (ownership check)."""
    order = await order_repo.get_order_by_id(order_id, provider_id=provider_id, session=session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    note = f"Waybill uploaded: {waybill_url}"
    if tracking_number:
        note += f" | tracking: {tracking_number}"
    await order_event_repo.create_order_event(
        order_id=order_id,
        event_type="waybill_uploaded",
        actor_id=actor_id,
        note=note,
        session=session,
    )
    return order
