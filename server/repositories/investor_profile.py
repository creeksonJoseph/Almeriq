from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.investor_profile import InvestorProfile

PROFILE_FIELDS = {"firm_name", "investment_focus", "check_size", "location", "about", "investor_type", "preferred_sectors", "preferred_stages", "geographies", "check_size_min", "check_size_max", "lead_follow_preference", "track_record", "value_add", "accreditation_status", "target_return_percent", "years_investing", "verification_url", "notable_investments", "companies_backed", "exits", "assets_under_management", "time_commitment", "contact_preference", "contact_formats", "preferred_payment_methods", "notify_deal_updates", "notify_messages"}
JSON_FIELDS = {"preferred_sectors": "preferred_sectors_json", "preferred_stages": "preferred_stages_json", "geographies": "geographies_json", "contact_formats": "contact_formats_json", "preferred_payment_methods": "preferred_payment_methods_json"}


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
    updates = {JSON_FIELDS.get(key, key): __import__("json").dumps(value or []) if key in JSON_FIELDS else value for key, value in updates.items()}
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
