"""repositories/provider_profile.py - SQLAlchemy 2.0 repository for ProviderProfile model."""
from __future__ import annotations

from datetime import datetime, timezone
import logging
from typing import Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.provider_profile import ProviderProfile
from models.provider_verification_event import ProviderVerificationEvent
from models.user import User

logger = logging.getLogger(__name__)


async def create_provider_profile(
    user_id: int,
    company_name: str | None = None,
    trading_name: str | None = None,
    provider_type: str | None = None,
    location: str | None = None,
    about: str | None = None,
    engagement_preferences: str | None = None,
    enclave_key: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new provider profile."""
    logger.info(f"[REPO-CREATE-PROVIDER] Starting for user_id: {user_id}")
    profile = ProviderProfile(
        user_id=user_id,
        company_name=company_name,
        trading_name=trading_name,
        provider_type=provider_type,
        location=location,
        about=about,
        engagement_preferences=engagement_preferences,
        enclave_key=enclave_key,
    )

    if session is not None:
        session.add(profile)
        await session.flush()
        return profile.to_dict()

    async with async_session_factory() as s:
        s.add(profile)
        await s.commit()
        await s.refresh(profile)
        return profile.to_dict()


async def get_provider_profile_by_user_id(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch provider profile by user_id."""
    stmt = select(ProviderProfile).where(ProviderProfile.user_id == user_id).limit(1)

    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None

    async with async_session_factory() as s:
        profile = await s.scalar(stmt)
        return profile.to_dict() if profile else None


async def get_provider_profile_by_id(
    profile_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch provider profile by id."""
    stmt = select(ProviderProfile).where(ProviderProfile.id == profile_id).limit(1)

    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None

    async with async_session_factory() as s:
        profile = await s.scalar(stmt)
        return profile.to_dict() if profile else None


async def update_provider_profile(
    user_id: int,
    company_name: str | None = None,
    trading_name: str | None = None,
    provider_type: str | None = None,
    location: str | None = None,
    about: str | None = None,
    engagement_preferences: str | None = None,
    enclave_key: str | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update provider profile."""
    values: dict = {}
    if company_name is not None:
        values["company_name"] = company_name
    if trading_name is not None:
        values["trading_name"] = trading_name
    if provider_type is not None:
        values["provider_type"] = provider_type
    if location is not None:
        values["location"] = location
    if about is not None:
        values["about"] = about
    if engagement_preferences is not None:
        values["engagement_preferences"] = engagement_preferences
    if enclave_key is not None:
        values["enclave_key"] = enclave_key

    if not values:
        return await get_provider_profile_by_user_id(user_id, session)

    stmt = (
        update(ProviderProfile)
        .where(ProviderProfile.user_id == user_id)
        .values(**values)
        .returning(ProviderProfile)
    )

    if session is not None:
        res = await session.execute(stmt)
        profile = res.scalar_one_or_none()
        return profile.to_dict() if profile else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        profile = res.scalar_one_or_none()
        return profile.to_dict() if profile else None

async def list_provider_profiles(
    verified: bool | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List provider profiles for the admin verification queue."""
    stmt = select(ProviderProfile).order_by(ProviderProfile.created_at.desc()).limit(limit).offset(offset)
    if verified is not None:
        stmt = stmt.where(ProviderProfile.verified == verified)
    if session is not None:
        return [profile.to_dict() for profile in (await session.scalars(stmt)).all()]
    async with async_session_factory() as db:
        return [profile.to_dict() for profile in (await db.scalars(stmt)).all()]


async def list_provider_verification_events(
    profile_id: int,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """Return immutable verification decisions newest first."""
    stmt = (
        select(ProviderVerificationEvent, User.full_name, User.email)
        .outerjoin(User, User.id == ProviderVerificationEvent.reviewer_id)
        .where(ProviderVerificationEvent.provider_id == profile_id)
        .order_by(ProviderVerificationEvent.id.desc())
        .limit(limit)
        .offset(offset)
    )
    if session is not None:
        rows = (await session.execute(stmt)).all()
        return [event.to_dict(name, email) for event, name, email in rows]
    async with async_session_factory() as db:
        rows = (await db.execute(stmt)).all()
        return [event.to_dict(name, email) for event, name, email in rows]


async def update_provider_verification(
    profile_id: int,
    verified: bool,
    verified_by: int | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Set provider verification and append an immutable reviewer event."""
    reviewed_at = datetime.now(timezone.utc)
    values = {
        "verified": verified,
        "verified_at": reviewed_at if verified else None,
        "verified_by": verified_by if verified else None,
        "verification_reviewed_at": reviewed_at,
        "verification_reviewed_by": verified_by,
    }
    stmt = (
        update(ProviderProfile)
        .where(ProviderProfile.id == profile_id)
        .values(**values)
        .returning(ProviderProfile)
    )

    if session is not None:
        profile = (await session.execute(stmt)).scalar_one_or_none()
        if profile is None:
            return None
        session.add(
            ProviderVerificationEvent(
                provider_id=profile_id,
                reviewer_id=verified_by,
                verified=verified,
                reviewed_at=reviewed_at,
            )
        )
        await session.flush()
        return profile.to_dict()

    async with async_session_factory() as db:
        profile = (await db.execute(stmt)).scalar_one_or_none()
        if profile is None:
            return None
        db.add(
            ProviderVerificationEvent(
                provider_id=profile_id,
                reviewer_id=verified_by,
                verified=verified,
                reviewed_at=reviewed_at,
            )
        )
        await db.commit()
        return profile.to_dict()
