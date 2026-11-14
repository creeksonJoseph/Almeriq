"""repositories/deal.py - SQLAlchemy 2.0 repository for Deal model."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.deal import Deal

logger = logging.getLogger(__name__)


async def create_deal(
    order_id: int,
    payment_method: str,
    amount: float,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new deal."""
    logger.info(f"[REPO-CREATE-DEAL] Starting: order_id={order_id}")
    deal = Deal(
        order_id=order_id,
        payment_method=payment_method,
        amount=amount,
    )

    if session is not None:
        session.add(deal)
        await session.flush()
        return deal.to_dict()

    async with async_session_factory() as s:
        s.add(deal)
        await s.commit()
        await s.refresh(deal)
        return deal.to_dict()


async def get_deal_by_id(
    deal_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch deal by id."""
    stmt = select(Deal).where(Deal.id == deal_id).limit(1)

    if session is not None:
        deal = await session.scalar(stmt)
        return deal.to_dict() if deal else None

    async with async_session_factory() as s:
        deal = await s.scalar(stmt)
        return deal.to_dict() if deal else None


async def get_deal_by_order_id(
    order_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch deal by order_id."""
    stmt = select(Deal).where(Deal.order_id == order_id).limit(1)

    if session is not None:
        deal = await session.scalar(stmt)
        return deal.to_dict() if deal else None

    async with async_session_factory() as s:
        deal = await s.scalar(stmt)
        return deal.to_dict() if deal else None


async def sign_deal(
    deal_id: int,
    signature: str,
    session: AsyncSession | None = None,
) -> dict | None:
    """Sign a deal with signature data URL."""
    from datetime import datetime, timezone

    stmt = (
        update(Deal)
        .where(Deal.id == deal_id)
        .values(signature=signature, signed_at=datetime.now(timezone.utc))
        .returning(Deal)
    )

    if session is not None:
        res = await session.execute(stmt)
        deal = res.scalar_one_or_none()
        return deal.to_dict() if deal else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        deal = res.scalar_one_or_none()
        return deal.to_dict() if deal else None