from __future__ import annotations
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.expert_profile import ExpertProfile

FIELDS = {"headline", "bio", "expertise", "years_experience", "location", "hourly_rate", "availability", "portfolio_url", "is_active"}


def _apply(profile: ExpertProfile, values: dict) -> None:
    for key, value in values.items():
        if key not in FIELDS:
            continue
        if key == "expertise":
            profile.expertise_json = json.dumps(value or [])
        else:
            setattr(profile, key, value)


async def upsert_expert_profile(user_id: int, session: AsyncSession | None = None, **values) -> dict:
    stmt = select(ExpertProfile).where(ExpertProfile.user_id == user_id).limit(1)
    if session is not None:
        profile = await session.scalar(stmt)
        if profile is None:
            profile = ExpertProfile(user_id=user_id)
            session.add(profile)
        _apply(profile, values)
        await session.flush()
        return profile.to_dict()
    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        if profile is None:
            profile = ExpertProfile(user_id=user_id)
            db.add(profile)
        _apply(profile, values)
        await db.commit()
        await db.refresh(profile)
        return profile.to_dict()


async def get_expert_profile(user_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(ExpertProfile).where(ExpertProfile.user_id == user_id).limit(1)
    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None
    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        return profile.to_dict() if profile else None


async def list_expert_profiles(limit: int = 50, offset: int = 0, session: AsyncSession | None = None) -> list[dict]:
    stmt = select(ExpertProfile).where(ExpertProfile.is_active.is_(True)).order_by(ExpertProfile.updated_at.desc()).limit(limit).offset(offset)
    if session is not None:
        rows = (await session.scalars(stmt)).all()
        return [row.to_dict() for row in rows]
    async with async_session_factory() as db:
        rows = (await db.scalars(stmt)).all()
        return [row.to_dict() for row in rows]
