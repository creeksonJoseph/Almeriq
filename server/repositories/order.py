"""repositories/order.py - SQLAlchemy 2.0 repository for Order model."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy import select, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.order import Order

logger = logging.getLogger(__name__)


async def create_order(
    order_id: str,
    client_id: int,
    provider_id: int,
    asset_id: int,
    allocation: str | None = None,
    lease_amount: float | None = None,
    status: str = "pending_review",
    session: AsyncSession | None = None,
) -> dict:
    """Create a new order."""
    logger.info(f"[REPO-CREATE-ORDER] Starting: order_id={order_id}, client_id={client_id}, provider_id={provider_id}")
    order = Order(
        order_id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        asset_id=asset_id,
        allocation=allocation,
        lease_amount=lease_amount,
        status=status,
    )

    if session is not None:
        session.add(order)
        await session.flush()
        return order.to_dict()

    async with async_session_factory() as s:
        s.add(order)
        await s.commit()
        await s.refresh(order)
        return order.to_dict()


async def get_order_by_id(
    order_id: int,
    provider_id: int | None = None,
    client_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch order by id, optionally scoped to provider or client."""
    stmt = select(Order).where(Order.id == order_id)
    if provider_id is not None:
        stmt = stmt.where(Order.provider_id == provider_id)
    if client_id is not None:
        stmt = stmt.where(Order.client_id == client_id)
    stmt = stmt.limit(1)

    if session is not None:
        order = await session.scalar(stmt)
        return order.to_dict() if order else None

    async with async_session_factory() as s:
        order = await s.scalar(stmt)
        return order.to_dict() if order else None


async def get_order_by_order_id(
    order_id: str,
    provider_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch order by order_id string, optionally scoped to provider."""
    stmt = select(Order).where(Order.order_id == order_id)
    if provider_id is not None:
        stmt = stmt.where(Order.provider_id == provider_id)
    stmt = stmt.limit(1)

    if session is not None:
        order = await session.scalar(stmt)
        return order.to_dict() if order else None

    async with async_session_factory() as s:
        order = await s.scalar(stmt)
        return order.to_dict() if order else None


async def list_orders(
    provider_id: int | None = None,
    client_id: int | None = None,
    status: str | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List orders with optional filters."""
    stmt = select(Order)
    count_stmt = select(func.count()).select_from(Order)

    if provider_id is not None:
        stmt = stmt.where(Order.provider_id == provider_id)
        count_stmt = count_stmt.where(Order.provider_id == provider_id)
    if client_id is not None:
        stmt = stmt.where(Order.client_id == client_id)
        count_stmt = count_stmt.where(Order.client_id == client_id)
    if status is not None:
        stmt = stmt.where(Order.status == status)
        count_stmt = count_stmt.where(Order.status == status)

    stmt = stmt.order_by(Order.created_at.desc()).limit(limit).offset(offset)

    if session is not None:
        result = await session.execute(stmt)
        orders = result.scalars().all()
        count = await session.scalar(count_stmt)
        return [o.to_dict() for o in orders], count or 0

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        orders = result.scalars().all()
        count = await s.scalar(count_stmt)
        return [o.to_dict() for o in orders], count or 0


async def update_order_status(
    order_id: int,
    provider_id: int,
    status: str,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update order status (ownership check via provider_id)."""
    stmt = (
        update(Order)
        .where(Order.id == order_id, Order.provider_id == provider_id)
        .values(status=status)
        .returning(Order)
    )

    if session is not None:
        res = await session.execute(stmt)
        order = res.scalar_one_or_none()
        return order.to_dict() if order else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        order = res.scalar_one_or_none()
        return order.to_dict() if order else None