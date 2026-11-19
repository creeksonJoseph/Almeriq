"""repositories/job_application.py - SQLAlchemy 2.0 repository for JobApplication model."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy import select, update, delete as sql_delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.job_application import JobApplication

logger = logging.getLogger(__name__)


async def create_job_application(
    job_posting_id: int,
    applicant_id: int,
    cover_letter: str | None = None,
    resume_url: str | None = None,
    status: str = "pending",
    session: AsyncSession | None = None,
) -> dict:
    """Create a new job application."""
    logger.info(
        "[REPO-CREATE-APPLICATION] Starting for job_posting_id: %s applicant_id: %s",
        job_posting_id,
        applicant_id,
    )
    application = JobApplication(
        job_posting_id=job_posting_id,
        applicant_id=applicant_id,
        cover_letter=cover_letter,
        resume_url=resume_url,
        status=status,
    )

    if session is not None:
        session.add(application)
        await session.flush()
        return application.to_dict()

    async with async_session_factory() as s:
        s.add(application)
        await s.commit()
        await s.refresh(application)
        return application.to_dict()


async def get_job_application_by_id(
    application_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch a job application by id."""
    stmt = select(JobApplication).where(JobApplication.id == application_id).limit(1)

    if session is not None:
        application = await session.scalar(stmt)
        return application.to_dict() if application else None

    async with async_session_factory() as s:
        application = await s.scalar(stmt)
        return application.to_dict() if application else None


async def get_applications_for_job(
    job_posting_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all applications for a job posting, newest first."""
    stmt = (
        select(JobApplication)
        .where(JobApplication.job_posting_id == job_posting_id)
        .order_by(JobApplication.created_at.desc())
    )

    if session is not None:
        rows = (await session.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async with async_session_factory() as s:
        rows = (await s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


async def get_applications_for_applicant(
    applicant_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all applications submitted by an applicant, newest first."""
    stmt = (
        select(JobApplication)
        .where(JobApplication.applicant_id == applicant_id)
        .order_by(JobApplication.created_at.desc())
    )

    if session is not None:
        rows = (await session.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]

    async with async_session_factory() as s:
        rows = (await s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


async def get_application_for_user_on_job(
    job_posting_id: int,
    applicant_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch an existing application for a user on a specific job (idempotency check)."""
    stmt = select(JobApplication).where(
        JobApplication.job_posting_id == job_posting_id,
        JobApplication.applicant_id == applicant_id,
    ).limit(1)

    if session is not None:
        application = await session.scalar(stmt)
        return application.to_dict() if application else None

    async with async_session_factory() as s:
        application = await s.scalar(stmt)
        return application.to_dict() if application else None


async def update_application_status(
    application_id: int,
    status: str,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update the status of a job application."""
    stmt = (
        update(JobApplication)
        .where(JobApplication.id == application_id)
        .values(status=status)
        .returning(JobApplication)
    )

    if session is not None:
        res = await session.execute(stmt)
        application = res.scalar_one_or_none()
        return application.to_dict() if application else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        application = res.scalar_one_or_none()
        return application.to_dict() if application else None


async def delete_job_application(
    application_id: int,
    session: AsyncSession | None = None,
) -> bool:
    """Delete a job application, returns True if it existed and was deleted."""
    stmt = sql_delete(JobApplication).where(JobApplication.id == application_id)

    if session is not None:
        result = await session.execute(stmt)
        return result.rowcount > 0

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        await s.commit()
        return result.rowcount > 0
