from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.investor_profile import InvestorProfile

async def create_investor_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    profile = InvestorProfile(user_id=user_id)
    if session is not None:
        session.add(profile); await session.flush(); return profile.to_dict()
    async with async_session_factory() as s:
        s.add(profile); await s.commit(); await s.refresh(profile); return profile.to_dict()

async def get_investor_profile_by_user_id(user_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(InvestorProfile).where(InvestorProfile.user_id == user_id).limit(1)
    if session is not None:
        p = await session.scalar(stmt); return p.to_dict() if p else None
    async with async_session_factory() as s:
        p = await s.scalar(stmt); return p.to_dict() if p else None
