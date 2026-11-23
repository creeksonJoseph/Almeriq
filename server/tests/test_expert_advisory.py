"""Expert advisory service tests.

Covers advisory request creation, validation, status transitions, and listing
for both founders and experts against an isolated SQLite database.
"""
from __future__ import annotations

from typing import AsyncGenerator

import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
import repositories.expert_profile as expert_profile_repo
import repositories.user as user_repo
from services import expert as expert_service


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    """Isolated async SQLite session per test."""
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'expert.db'}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


async def _make_user(session: AsyncSession, email: str, role: str = "user") -> int:
    user = await user_repo.create_user(
        email=email, hashed_password="x", role=role, session=session
    )
    await session.commit()
    return user["id"]


async def _make_expert(session: AsyncSession, user_id: int) -> None:
    await expert_profile_repo.upsert_expert_profile(
        user_id=user_id,
        session=session,
        headline="Cloud infrastructure advisor",
        is_active=True,
        years_experience=5,
        hourly_rate=150.0,
    )
    await session.commit()


# ── Advisory request creation ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_advisory_request_success(session):
    founder_id = await _make_user(session, "founder@example.com", role="founder")
    expert_id = await _make_user(session, "expert@example.com", role="expert")
    await _make_expert(session, expert_id)

    request = await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Architecture review",
        description="Please review our multi-region deployment architecture.",
        budget=5000.0,
        session=session,
    )
    await session.commit()
    assert request["status"] == "pending"
    assert request["founder_id"] == founder_id
    assert request["expert_id"] == expert_id
    assert request["subject"] == "Architecture review"


@pytest.mark.asyncio
async def test_create_advisory_request_self_rejected(session):
    user_id = await _make_user(session, "self@example.com", role="founder")
    await _make_expert(session, user_id)
    with pytest.raises(HTTPException) as exc:
        await expert_service.create_request(
            founder_id=user_id,
            expert_id=user_id,
            subject="Self request",
            description="Should not be allowed.",
            session=session,
        )
    assert exc.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_advisory_request_expert_not_found(session):
    founder_id = await _make_user(session, "founder2@example.com", role="founder")
    with pytest.raises(HTTPException) as exc:
        await expert_service.create_request(
            founder_id=founder_id,
            expert_id=99999,
            subject="No such expert",
            description="This expert does not exist.",
            session=session,
        )
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_advisory_request_validation(session):
    founder_id = await _make_user(session, "founder3@example.com", role="founder")
    expert_id = await _make_user(session, "expert3@example.com", role="expert")
    await _make_expert(session, expert_id)

    with pytest.raises(HTTPException) as exc:
        await expert_service.create_request(
            founder_id=founder_id,
            expert_id=expert_id,
            subject="Hi",
            description="Too short description.",
            session=session,
        )
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    with pytest.raises(HTTPException) as exc:
        await expert_service.create_request(
            founder_id=founder_id,
            expert_id=expert_id,
            subject="Valid subject here",
            description="short",
            session=session,
        )
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    with pytest.raises(HTTPException) as exc:
        await expert_service.create_request(
            founder_id=founder_id,
            expert_id=expert_id,
            subject="Valid subject here",
            description="A valid description with enough characters.",
            budget=-100.0,
            session=session,
        )
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


# ── Advisory request status transitions ───────────────────────────────────

@pytest.mark.asyncio
async def test_update_advisory_request_accept_decline_complete(session):
    founder_id = await _make_user(session, "f4@example.com", role="founder")
    expert_id = await _make_user(session, "e4@example.com", role="expert")
    await _make_expert(session, expert_id)

    request = await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Migration planning",
        description="Help plan the database migration.",
        session=session,
    )
    await session.commit()
    request_id = request["id"]

    accepted = await expert_service.update_request(
        request_id=request_id, expert_id=expert_id, status_value="accepted", session=session
    )
    await session.commit()
    assert accepted["status"] == "accepted"

    completed = await expert_service.update_request(
        request_id=request_id, expert_id=expert_id, status_value="completed", session=session
    )
    await session.commit()
    assert completed["status"] == "completed"


@pytest.mark.asyncio
async def test_update_advisory_request_transition_rules(session):
    founder_id = await _make_user(session, "f5@example.com", role="founder")
    expert_id = await _make_user(session, "e5@example.com", role="expert")
    await _make_expert(session, expert_id)

    request = await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Transition rules",
        description="Verify status transition rules are enforced.",
        session=session,
    )
    await session.commit()
    request_id = request["id"]

    # Cannot complete before accepting.
    with pytest.raises(HTTPException) as exc:
        await expert_service.update_request(
            request_id=request_id, expert_id=expert_id, status_value="completed", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT

    # Invalid status value.
    with pytest.raises(HTTPException) as exc:
        await expert_service.update_request(
            request_id=request_id, expert_id=expert_id, status_value="archived", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


@pytest.mark.asyncio
async def test_update_advisory_request_closed_rejected(session):
    founder_id = await _make_user(session, "f6@example.com", role="founder")
    expert_id = await _make_user(session, "e6@example.com", role="expert")
    await _make_expert(session, expert_id)

    request = await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Closed request",
        description="Already closed requests must not change.",
        session=session,
    )
    await session.commit()
    request_id = request["id"]

    await expert_service.update_request(
        request_id=request_id, expert_id=expert_id, status_value="declined", session=session
    )
    await session.commit()

    with pytest.raises(HTTPException) as exc:
        await expert_service.update_request(
            request_id=request_id, expert_id=expert_id, status_value="accepted", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT


@pytest.mark.asyncio
async def test_update_advisory_request_wrong_expert(session):
    founder_id = await _make_user(session, "f7@example.com", role="founder")
    expert_id = await _make_user(session, "e7@example.com", role="expert")
    intruder_id = await _make_user(session, "intruder@example.com", role="expert")
    await _make_expert(session, expert_id)
    await _make_expert(session, intruder_id)

    request = await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Wrong expert",
        description="Only the assigned expert may respond.",
        session=session,
    )
    await session.commit()
    request_id = request["id"]

    with pytest.raises(HTTPException) as exc:
        await expert_service.update_request(
            request_id=request_id, expert_id=intruder_id, status_value="accepted", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


# ── Listing advisory requests ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_advisory_requests_for_founder_and_expert(session):
    founder_id = await _make_user(session, "f8@example.com", role="founder")
    expert_id = await _make_user(session, "e8@example.com", role="expert")
    await _make_expert(session, expert_id)

    await expert_service.create_request(
        founder_id=founder_id,
        expert_id=expert_id,
        subject="Listing test",
        description="Verify listing returns the request for both parties.",
        session=session,
    )
    await session.commit()

    founder_requests = await expert_service.list_requests(founder_id, "founder", session=session)
    assert len(founder_requests) == 1
    assert founder_requests[0]["expert_id"] == expert_id

    expert_requests = await expert_service.list_requests(expert_id, "expert", session=session)
    assert len(expert_requests) == 1
    assert expert_requests[0]["founder_id"] == founder_id
