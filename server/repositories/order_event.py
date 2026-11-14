"""repositories/order_event.py - SQLAlchemy 2.0 repository for OrderEvent model."""
from __future__ import annotations
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.order_event import OrderEvent

logger = logging.getLogger(__name__)


async def create_order_event(
    order_id: int,
    event_type: str,
    actor_id: int,
    note: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new order event."""
    logger.info(f"[REPO-CREATE-ORDER-EVENT] Starting: order_id={order_id}, event_type={event_type}")
    event = OrderEvent(
        order_id=order_id,
        event_type=event_type,
        actor_id=actor_id,
        note=note,
    )

    if session is not None:
        session.add(event)
        await session.flush()
        return event.to_dict()

    async with async_session_factory() as s:
        s.add(event)
        await s.commit()
        await s.refresh(event)
        return event.to_dict()


async def list_order_events(
    order_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all events for an order."""
    stmt = select(OrderEvent).where(OrderEvent.order_id == order_id).order_by(OrderEvent.created_at.desc())

    if session is not None:
        result = await session.execute(stmt)
        events = result.scalars().all()
        return [e.to_dict() for e in events]

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        events = result.scalars().all()
        return [e.to_dict() for e in events]