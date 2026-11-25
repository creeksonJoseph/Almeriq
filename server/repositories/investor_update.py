from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session_factory
from models.investor_update import InvestorUpdate


async def create_investor_update(founder_id: int, pitch_id: int, period: str, content: str, session: AsyncSession | None = None) -> dict:
    item = InvestorUpdate(founder_id=founder_id, pitch_id=pitch_id, period=period, content=content, status="draft")
    if session is not None:
        session.add(item)
        await session.flush()
        return item.to_dict()
    async with async_session_factory() as db:
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item.to_dict()


async def get_investor_update(update_id: int, founder_id: int | None = None, session: AsyncSession | None = None) -> dict | None:
    stmt = select(InvestorUpdate).where(InvestorUpdate.id == update_id)
    if founder_id is not None:
        stmt = stmt.where(InvestorUpdate.founder_id == founder_id)
    if session is not None:
        item = await session.scalar(stmt)
        return item.to_dict() if item else None
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        return item.to_dict() if item else None


async def list_founder_investor_updates(founder_id: int, pitch_id: int | None = None, session: AsyncSession | None = None) -> list[dict]:
    stmt = select(InvestorUpdate).where(InvestorUpdate.founder_id == founder_id).order_by(InvestorUpdate.created_at.desc())
    if pitch_id is not None:
        stmt = stmt.where(InvestorUpdate.pitch_id == pitch_id)
    if session is not None:
        return [item.to_dict() for item in (await session.scalars(stmt)).all()]
    async with async_session_factory() as db:
        return [item.to_dict() for item in (await db.scalars(stmt)).all()]


async def list_published_investor_updates(pitch_ids: list[int], session: AsyncSession | None = None) -> list[dict]:
    if not pitch_ids:
        return []
    stmt = select(InvestorUpdate).where(
        InvestorUpdate.pitch_id.in_(pitch_ids),
        InvestorUpdate.status == "published",
    ).order_by(InvestorUpdate.published_at.desc(), InvestorUpdate.created_at.desc())
    if session is not None:
        return [item.to_dict() for item in (await session.scalars(stmt)).all()]
    async with async_session_factory() as db:
        return [item.to_dict() for item in (await db.scalars(stmt)).all()]


async def publish_investor_update(update_id: int, founder_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = update(InvestorUpdate).where(
        InvestorUpdate.id == update_id,
        InvestorUpdate.founder_id == founder_id,
    ).values(status="published", published_at=datetime.now(timezone.utc)).returning(InvestorUpdate)
    if session is not None:
        item = (await session.execute(stmt)).scalar_one_or_none()
        return item.to_dict() if item else None
    async with async_session_factory() as db:
        item = (await db.execute(stmt)).scalar_one_or_none()
        await db.commit()
        return item.to_dict() if item else None


async def update_investor_update(update_id: int, founder_id: int, period: str, content: str, session: AsyncSession | None = None) -> dict | None:
    stmt = select(InvestorUpdate).where(
        InvestorUpdate.id == update_id,
        InvestorUpdate.founder_id == founder_id,
        InvestorUpdate.status == "draft",
    )
    if session is not None:
        item = await session.scalar(stmt)
        if item is None:
            return None
        item.period = period
        item.content = content
        await session.flush()
        return item.to_dict()
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        if item is None:
            return None
        item.period = period
        item.content = content
        await db.commit()
        await db.refresh(item)
        return item.to_dict()
