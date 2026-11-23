"""SQLAlchemy repository for job seeker profiles."""
from __future__ import annotations
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.job_seeker_profile import JobSeekerProfile

JSON_FIELDS = {
    "skills": "skills_json",
    "experience": "experience_json",
    "education": "education_json",
    "certifications": "certifications_json",
    "projects": "projects_json",
    "preferences": "preferences_json",
}
SCALAR_FIELDS = {
    "headline", "bio", "location", "experience_years", "resume_url",
    "portfolio_url", "is_active",
}


def _apply_values(profile: JobSeekerProfile, values: dict) -> None:
    for key, value in values.items():
        if key in JSON_FIELDS:
            setattr(profile, JSON_FIELDS[key], json.dumps(value if value is not None else ([] if key != "preferences" else {})))
        elif key in SCALAR_FIELDS:
            setattr(profile, key, value)


async def create_or_update_job_seeker_profile(
    user_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    stmt = select(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id).limit(1)
    if session is not None:
        profile = await session.scalar(stmt)
        if profile is None:
            profile = JobSeekerProfile(user_id=user_id)
            session.add(profile)
        _apply_values(profile, values)
        await session.flush()
        return profile.to_dict()

    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        if profile is None:
            profile = JobSeekerProfile(user_id=user_id)
            db.add(profile)
        _apply_values(profile, values)
        await db.commit()
        await db.refresh(profile)
        return profile.to_dict()


async def get_job_seeker_profile_by_user_id(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    stmt = select(JobSeekerProfile).where(JobSeekerProfile.user_id == user_id).limit(1)
    if session is not None:
        profile = await session.scalar(stmt)
        return profile.to_dict() if profile else None
    async with async_session_factory() as db:
        profile = await db.scalar(stmt)
        return profile.to_dict() if profile else None
