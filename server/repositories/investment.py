from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.investment import Investment

async def create_investment(investor_id: int, pitch_id: int, session: AsyncSession | None = None) -> dict:
    inv = Investment(investor_id=investor_id, pitch_id=pitch_id)
    if session is not None:
        session.add(inv); await session.flush(); return inv.to_dict()
    async with async_session_factory() as s:
        s.add(inv); await s.commit(); await s.refresh(inv); return inv.to_dict()

async def list_investments(session: AsyncSession | None = None) -> list[dict]:
    stmt = select(Investment)
    if session is not None:
        res = await session.scalars(stmt); return [i.to_dict() for i in res]
    async with async_session_factory() as s:
        res = await s.scalars(stmt); return [i.to_dict() for i in res]
