from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session_factory
from models.investor_update import InvestorUpdate
from models.investment import Investment
from models.startup_pitch import StartupPitch


async def create_update(founder_id: int, pitch_id: int, period: str, content: str, session: AsyncSession) -> dict:
    item = InvestorUpdate(founder_id=founder_id, pitch_id=pitch_id, period=period, content=content)
    session.add(item)
    await session.flush()
    return item.to_dict()


async def get_update(update_id: int, founder_id: int, session: AsyncSession) -> dict | None:
    item = await session.scalar(select(InvestorUpdate).where(
        InvestorUpdate.id == update_id,
        InvestorUpdate.founder_id == founder_id,
    ))
    return item.to_dict() if item else None


async def list_founder_updates(founder_id: int, session: AsyncSession) -> list[dict]:
    rows = (await session.scalars(
        select(InvestorUpdate)
        .where(InvestorUpdate.founder_id == founder_id)
        .order_by(InvestorUpdate.created_at.desc())
    )).all()
    return [row.to_dict() for row in rows]


async def update_draft(update_id: int, founder_id: int, period: str, content: str, session: AsyncSession) -> dict | None:
    item = await session.scalar(select(InvestorUpdate).where(
        InvestorUpdate.id == update_id,
        InvestorUpdate.founder_id == founder_id,
    ))
    if item is None:
        return None
    if item.status != "draft":
        return None
    item.period = period
    item.content = content
    await session.flush()
    return item.to_dict()


async def publish_update(update_id: int, founder_id: int, session: AsyncSession) -> dict | None:
    item = await session.scalar(select(InvestorUpdate).where(
        InvestorUpdate.id == update_id,
        InvestorUpdate.founder_id == founder_id,
    ))
    if item is None or item.status != "draft":
        return None
    item.status = "published"
    item.published_at = datetime.now(timezone.utc)
    await session.flush()
    return item.to_dict()


async def list_investor_updates(investor_id: int, session: AsyncSession) -> list[dict]:
    rows = (await session.execute(
        select(InvestorUpdate, StartupPitch.title.label("pitch_title"))
        .join(StartupPitch, StartupPitch.id == InvestorUpdate.pitch_id)
        .join(Investment, Investment.pitch_id == StartupPitch.id)
        .where(
            Investment.investor_id == investor_id,
            Investment.status.in_([ "pending", "accepted", "in_discussion", "invested" ]),
            InvestorUpdate.status == "published",
        )
        .distinct()
        .order_by(InvestorUpdate.published_at.desc())
    )).all()
    return [{**item.to_dict(), "pitch_title": pitch_title} for item, pitch_title in rows]
