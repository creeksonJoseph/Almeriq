"""services/order.py - Business logic for orders."""
from __future__ import annotations
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import order as order_repo
from repositories import order_event as order_event_repo
from repositories import provider_profile as provider_repo
from repositories import notification as notification_repo


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


async def list_client_orders(
    client_id: int,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List orders placed by the authenticated marketplace buyer."""
    return await order_repo.list_orders(
        client_id=client_id, limit=limit, offset=offset, session=session
    )


async def get_client_order(
    order_id: int,
    client_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get one buyer-owned order with its event timeline."""
    order = await order_repo.get_order_by_id(order_id, client_id=client_id, session=session)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    order["events"] = await order_event_repo.list_order_events(order_id, session=session)
    return order


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
    order = await order_repo.create_order(
        order_id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        asset_id=asset_id,
        allocation=allocation,
        lease_amount=lease_amount,
        session=session,
    )
    await order_event_repo.create_order_event(
        order_id=order["id"],
        event_type="created",
        actor_id=client_id,
        note="Order submitted from the marketplace.",
        session=session,
    )
    provider = await provider_repo.get_provider_profile_by_id(provider_id, session=session)
    if provider and provider["user_id"] != client_id:
        await notification_repo.create_notification(
            user_id=provider["user_id"],
            type="order",
            title="New order request",
            body=f"Order {order_id} has been submitted for your listing.",
            link=f"/provider/orders/{order['id']}",
            session=session,
        )
    return order


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
    """Update an order's status using the supported provider workflow."""
    order = await order_repo.get_order_by_id(
        order_id, provider_id=provider_id, session=session
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    allowed_transitions = {
        "pending_review": {"confirmed", "declined"},
        "confirmed": {"shipped"},
        "shipped": {"completed"},
    }
    if new_status not in allowed_transitions.get(order["status"], set()):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Order cannot transition from {order['status']} to {new_status}",
        )
    if new_status == "shipped":
        events = await order_event_repo.list_order_events(order_id, session=session)
        if not any(event["event_type"] == "waybill_uploaded" for event in events):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Upload a waybill before marking this order as shipped",
            )
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
    await notification_repo.create_notification(
        user_id=order["client_id"],
        type="order",
        title="Order status updated",
        body=f"Order {order['order_id']} is now {new_status.replace('_', ' ')}.",
        link="/founder/orders",
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
    if order["status"] != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A waybill can only be uploaded for a confirmed order",
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


async def get_waybill(
    order_id: int,
    provider_id: int,
    session: AsyncSession | None = None,
) -> dict:
    order = await order_repo.get_order_by_id(order_id, provider_id=provider_id, session=session)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    events = await order_event_repo.list_order_events(order_id, session=session)
    uploaded = next((event for event in reversed(events) if event["event_type"] == "waybill_uploaded"), None)
    if not uploaded:
        return {"order_id": order_id}
    note = uploaded.get("note") or ""
    waybill_url = note.removeprefix("Waybill uploaded: ").split(" | tracking:", 1)[0].strip()
    tracking_number = None
    if " | tracking:" in note:
        tracking_number = note.split(" | tracking:", 1)[1].strip() or None
    return {
        "order_id": order_id,
        "waybill_url": waybill_url or None,
        "tracking_number": tracking_number,
        "uploaded_at": uploaded.get("created_at"),
    }
