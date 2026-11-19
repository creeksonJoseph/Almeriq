"""repositories/job_posting.py - SQLAlchemy 2.0 repository for JobPosting model."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy import select, update, delete as sql_delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.job_posting import JobPosting

logger = logging.getLogger(__name__)


async def create_job_posting(
    provider_id: int,
    title: str,
    description: str,
    location: str | None = None,
    role_type: str | None = None,
    salary_min: Optional[float] = None,
    salary_max: Optional[float] = None,
    requirements: str | None = None,
    is_active: bool = True,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new job posting."""
    logger.info("[REPO-CREATE-JOB] Starting for provider_id: %s", provider_id)
    posting = JobPosting(
        provider_id=provider_id,
        title=title,
        description=description,
        location=location,
        role_type=role_type,
        salary_min=salary_min,
        salary_max=salary_max,
        requirements=requirements,
        is_active=is_active,
    )

    if session is not None:
        session.add(posting)
        await session.flush()
        return posting.to_dict()

    async with async_session_factory() as s:
        s.add(posting)
        await s.commit()
        await s.refresh(posting)
        return posting.to_dict()


async def get_job_posting_by_id(
    job_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch a job posting by id."""
    stmt = select(JobPosting).where(JobPosting.id == job_id).limit(1)

    if session is not None:
        posting = await session.scalar(stmt)
        return posting.to_dict() if posting else None

    async with async_session_factory() as s:
        posting = await s.scalar(stmt)
        return posting.to_dict() if posting else None


async def list_job_postings(
    is_active: bool | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List job postings, newest first, optionally filtered by active status."""
    stmt = select(JobPosting).order_by(JobPosting.created_at.desc()).limit(limit).offset(offset)
    if is_active is not None:
        stmt = stmt.where(JobPosting.is_active == is_active)

    if session is not None:
        rows = (await session.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async with async_session_factory() as s:
        rows = (await s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


async def count_job_postings(
    is_active: bool | None = None,
    session: AsyncSession | None = None,
) -> int:
    """Count job postings, optionally filtered by active status."""
    stmt = select(func.count()).select_from(JobPosting)
    if is_active is not None:
        stmt = stmt.where(JobPosting.is_active == is_active)

    if session is not None:
        return await session.scalar(stmt) or 0

    async with async_session_factory() as s:
        return await s.scalar(stmt) or 0


async def update_job_posting(
    job_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict | None:
    """Update a job posting by id."""
    if not values:
        return await get_job_posting_by_id(job_id, session)

    stmt = (
        update(JobPosting)
        .where(JobPosting.id == job_id)
        .values(**values)
        .returning(JobPosting)
    )

    if session is not None:
        res = await session.execute(stmt)
        posting = res.scalar_one_or_none()
        return posting.to_dict() if posting else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        posting = res.scalar_one_or_none()
        return posting.to_dict() if posting else None


async def delete_job_posting(
    job_id: int,
    session: AsyncSession | None = None,
) -> bool:
    """Delete a job posting, returns True if it existed and was deleted."""
    stmt = sql_delete(JobPosting).where(JobPosting.id == job_id)

    if session is not None:
        result = await session.execute(stmt)
        return result.rowcount > 0

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        await s.commit()
        return result.rowcount > 0
