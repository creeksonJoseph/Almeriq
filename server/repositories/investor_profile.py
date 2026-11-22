from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.investor_profile import InvestorProfile

PROFILE_FIELDS = {"firm_name", "investment_focus", "check_size", "location", "about"}


async def create_investor_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    profile = InvestorProfile(user_id=user_id)
    if session is not None:
        session.add(profile)
        await session.flush()
        return profile.to_dict()
    async with async_session_factory() as db:
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile.to_dict()


async def get_investor_profile_by_user_id(user_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(InvestorProfile).where(InvestorProfile.user_id == user_id).limit(1)
    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None
    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        return profile.to_dict() if profile else None


async def upsert_investor_profile(user_id: int, session: AsyncSession | None = None, **values) -> dict:
    stmt = select(InvestorProfile).where(InvestorProfile.user_id == user_id).limit(1)
    updates = {key: value for key, value in values.items() if key in PROFILE_FIELDS}
    if session is not None:
        profile = await session.scalar(stmt)
        if profile is None:
            profile = InvestorProfile(user_id=user_id)
            session.add(profile)
        for key, value in updates.items():
            setattr(profile, key, value)
        await session.flush()
        return profile.to_dict()
    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        if profile is None:
            profile = InvestorProfile(user_id=user_id)
            db.add(profile)
        for key, value in updates.items():
            setattr(profile, key, value)
        await db.commit()
        await db.refresh(profile)
        return profile.to_dict()
