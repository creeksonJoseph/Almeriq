"""Founder and provider ownership coverage for job postings."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
from repositories.user import create_user
from services.job import (
    create_job_application,
    create_job_posting,
    delete_job_posting,
    update_application_status,
    update_job_posting,
)
from services.provider import create_or_update_provider_profile


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'jobs.db'}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


async def _make_user(session: AsyncSession, role: str) -> dict:
    return await create_user(
        email=f"{uuid.uuid4().hex}@example.com",
        hashed_password="test",
        role=role,
        session=session,
    )


async def _make_provider(session: AsyncSession) -> int:
    user = await _make_user(session, "INFRASTRUCTURE_PROVIDER")
    profile = await create_or_update_provider_profile(
        user["id"], company_name="Test Provider", location="Nairobi", session=session
    )
    return profile["id"]


@pytest.mark.asyncio
async def test_founder_can_create_update_and_delete_job(session: AsyncSession):
    founder = await _make_user(session, "founder")
    posting = await create_job_posting(
        provider_id=None,
        founder_user_id=founder["id"],
        title="Backend Engineer",
        description="Build platform services.",
        session=session,
    )
    await session.commit()

    assert posting["provider_id"] is None
    assert posting["founder_user_id"] == founder["id"]

    updated = await update_job_posting(
        posting["id"], founder_user_id=founder["id"], title="Senior Backend Engineer",
        session=session,
    )
    await session.commit()
    assert updated["title"] == "Senior Backend Engineer"

    await delete_job_posting(posting["id"], founder_user_id=founder["id"], session=session)
    await session.commit()


@pytest.mark.asyncio
async def test_founder_cannot_manage_another_founders_job(session: AsyncSession):
    owner = await _make_user(session, "founder")
    other = await _make_user(session, "founder")
    posting = await create_job_posting(
        provider_id=None, founder_user_id=owner["id"],
        title="Designer", description="Design product experiences.", session=session,
    )
    await session.commit()

    with pytest.raises(HTTPException) as exc:
        await update_job_posting(
            posting["id"], founder_user_id=other["id"], title="Hijacked", session=session
        )
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_founder_can_review_applications_for_owned_job(session: AsyncSession):
    founder = await _make_user(session, "founder")
    applicant = await _make_user(session, "JOB_SEEKER")
    posting = await create_job_posting(
        provider_id=None, founder_user_id=founder["id"],
        title="Product Engineer", description="Build product features.", session=session,
    )
    await session.commit()
    application = await create_job_application(
        posting["id"], applicant["id"], cover_letter="I am interested.", session=session
    )
    await session.commit()

    reviewed = await update_application_status(
        application["id"], "reviewed", founder_user_id=founder["id"],
        job_posting_id=posting["id"], session=session,
    )
    await session.commit()
    assert reviewed["status"] == "reviewed"


@pytest.mark.asyncio
async def test_provider_owned_job_creation_remains_supported(session: AsyncSession):
    provider_id = await _make_provider(session)
    posting = await create_job_posting(
        provider_id=provider_id,
        founder_user_id=None,
        title="Site Reliability Engineer",
        description="Operate production infrastructure.",
        session=session,
    )
    await session.commit()

    assert posting["provider_id"] == provider_id
    assert posting["founder_user_id"] is None


@pytest.mark.asyncio
async def test_job_creation_rejects_missing_or_ambiguous_owner(session: AsyncSession):
    founder = await _make_user(session, "founder")
    with pytest.raises(HTTPException) as missing:
        await create_job_posting(
            provider_id=None, founder_user_id=None,
            title="Invalid", description="No owner.", session=session,
        )
    assert missing.value.status_code == 400

    with pytest.raises(HTTPException) as ambiguous:
        await create_job_posting(
            provider_id=1, founder_user_id=founder["id"],
            title="Invalid", description="Two owners.", session=session,
        )
    assert ambiguous.value.status_code == 400
