from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.investment import Investment
from models.startup_pitch import StartupPitch


async def create_investment(investor_id: int, pitch_id: int, amount: float | None = None, session: AsyncSession | None = None) -> dict:
    investment = Investment(investor_id=investor_id, pitch_id=pitch_id, amount=amount, status="pending")
    if session is not None:
        session.add(investment)
        await session.flush()
        return investment.to_dict()
    async with async_session_factory() as db:
        db.add(investment)
        await db.commit()
        await db.refresh(investment)
        return investment.to_dict()


async def get_investment(investment_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(Investment).where(Investment.id == investment_id)
    if session is not None:
        item = await session.scalar(stmt)
        return item.to_dict() if item else None
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        return item.to_dict() if item else None


async def list_investments(investor_id: int | None = None, founder_id: int | None = None, session: AsyncSession | None = None) -> list[dict]:
    stmt = select(Investment)
    if investor_id is not None:
        stmt = stmt.where(Investment.investor_id == investor_id)
    if founder_id is not None:
        stmt = stmt.join(StartupPitch, StartupPitch.id == Investment.pitch_id).where(StartupPitch.founder_id == founder_id)
    stmt = stmt.order_by(Investment.created_at.desc())
    if session is not None:
        rows = (await session.scalars(stmt)).all()
        return [row.to_dict() for row in rows]
    async with async_session_factory() as db:
        rows = (await db.scalars(stmt)).all()
        return [row.to_dict() for row in rows]


async def update_investment_status(investment_id: int, status_value: str, session: AsyncSession | None = None) -> dict | None:
    stmt = select(Investment).where(Investment.id == investment_id)
    if session is not None:
        item = await session.scalar(stmt)
        if item is None:
            return None
        item.status = status_value
        await session.flush()
        return item.to_dict()
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        if item is None:
            return None
        item.status = status_value
        await db.commit()
        await db.refresh(item)
        return item.to_dict()


async def update_investor_portfolio(
    investment_id: int,
    investor_id: int,
    values: dict,
    session: AsyncSession,
) -> dict | None:
    item = await session.scalar(select(Investment).where(
        Investment.id == investment_id,
        Investment.investor_id == investor_id,
    ))
    if item is None:
        return None
    for key in ("investment_amount", "current_value", "ownership_percent", "investment_date", "notes"):
        if key in values:
            setattr(item, key, values[key])
    if values.get("investment_amount") is not None:
        item.status = "invested"
    await session.flush()
    return item.to_dict()
