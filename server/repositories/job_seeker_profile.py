"""repositories/job_seeker_profile.py - SQLAlchemy 2.0 repository for JobSeekerProfile model."""
from __future__ import annotations
import json
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.job_seeker_profile import JobSeekerProfile

logger = logging.getLogger(__name__)


async def create_or_update_job_seeker_profile(
    user_id: int,
    headline: str | None = None,
    bio: str | None = None,
    location: str | None = None,
    skills: list[str] | None = None,
    experience_years: int | None = None,
    resume_url: str | None = None,
    portfolio_url: str | None = None,
    is_active: bool = True,
    session: AsyncSession | None = None,
) -> dict:
    """Create or update a job seeker profile."""
    logger.info("[REPO-CREATE-SEEKER] Starting for user_id: %s", user_id)
    skills_json = json.dumps(skills if skills is not None else [])

    existing_stmt = select(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id).limit(1)

    if session is not None:
        existing = await session.scalar(existing_stmt)
        if existing:
            if headline is not None:
                existing.headline = headline
            if bio is not None:
                existing.bio = bio
            if location is not None:
                existing.location = location
            if skills is not None:
                existing.skills_json = skills_json
            if experience_years is not None:
                existing.experience_years = experience_years
            if resume_url is not None:
                existing.resume_url = resume_url
            if portfolio_url is not None:
                existing.portfolio_url = portfolio_url
            existing.is_active = is_active
            await session.flush()
            return existing.to_dict()
        profile = JobSeekerProfile(
            user_id=user_id,
            headline=headline,
            bio=bio,
            location=location,
            skills_json=skills_json,
            experience_years=experience_years,
            resume_url=resume_url,
            portfolio_url=portfolio_url,
            is_active=is_active,
        )
        session.add(profile)
        await session.flush()
        return profile.to_dict()

    async with async_session_factory() as s:
        existing = await s.scalar(existing_stmt)
        if existing:
            if headline is not None:
                existing.headline = headline
            if bio is not None:
                existing.bio = bio
            if location is not None:
                existing.location = location
            if skills is not None:
                existing.skills_json = skills_json
            if experience_years is not None:
                existing.experience_years = experience_years
            if resume_url is not None:
                existing.resume_url = resume_url
            if portfolio_url is not None:
                existing.portfolio_url = portfolio_url
            existing.is_active = is_active
            await s.commit()
            await s.refresh(existing)
            return existing.to_dict()
        profile = JobSeekerProfile(
            user_id=user_id,
            headline=headline,
            bio=bio,
            location=location,
            skills_json=skills_json,
            experience_years=experience_years,
            resume_url=resume_url,
            portfolio_url=portfolio_url,
            is_active=is_active,
        )
        s.add(profile)
        await s.commit()
        await s.refresh(profile)
        return profile.to_dict()


async def get_job_seeker_profile_by_user_id(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch a job seeker profile by user_id."""
    stmt = select(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id).limit(1)

    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None

    async with async_session_factory() as s:
        profile = await s.scalar(stmt)
        return profile.to_dict() if profile else None
