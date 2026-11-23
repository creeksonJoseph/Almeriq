"""Team membership service tests.

Covers team invitations, membership lifecycle, and authorization boundaries
between founders and job seekers against an isolated SQLite database.
"""
from __future__ import annotations

from typing import AsyncGenerator

import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
import repositories.job_seeker_profile as seeker_repo
import repositories.team as team_repo
import repositories.user as user_repo
from services import team as team_service


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    """Isolated async SQLite session per test."""
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'team.db'}",
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


async def _make_job_seeker(session: AsyncSession, user_id: int) -> None:
    await seeker_repo.create_or_update_job_seeker_profile(
        user_id=user_id,
        session=session,
        headline="Full-stack engineer",
        is_active=True,
    )
    await session.commit()


# ── Invitations ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_invitation_success(session):
    founder_id = await _make_user(session, "founder@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id,
        invitee_id=seeker_id,
        message="Join my founding team.",
        session=session,
    )
    await session.commit()
    assert invitation["status"] == "pending"
    assert invitation["founder_id"] == founder_id
    assert invitation["invitee_id"] == seeker_id


@pytest.mark.asyncio
async def test_create_invitation_self_rejected(session):
    founder_id = await _make_user(session, "self@example.com", role="founder")
    with pytest.raises(HTTPException) as exc:
        await team_service.create_invitation(
            founder_id=founder_id,
            invitee_id=founder_id,
            session=session,
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_invitation_no_talent_profile(session):
    founder_id = await _make_user(session, "founder2@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker2@example.com", role="job_seeker")
    # No job seeker profile created for the invitee.
    with pytest.raises(HTTPException) as exc:
        await team_service.create_invitation(
            founder_id=founder_id,
            invitee_id=seeker_id,
            session=session,
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_invitation_already_member_and_pending(session):
    founder_id = await _make_user(session, "founder3@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker3@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()

    # Duplicate pending invitation -> 409.
    with pytest.raises(HTTPException) as exc:
        await team_service.create_invitation(
            founder_id=founder_id, invitee_id=seeker_id, session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT

    # Accept the invitation, then re-invite -> already a member (409).
    invitations = await team_service.list_invitations(founder_id, True, session=session)
    await team_service.respond_to_invitation(
        invitations[0]["id"], seeker_id, "accepted", session=session
    )
    await session.commit()

    with pytest.raises(HTTPException) as exc:
        await team_service.create_invitation(
            founder_id=founder_id, invitee_id=seeker_id, session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT


# ── Responding to invitations ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_respond_to_invitation_accepted_creates_membership(session):
    founder_id = await _make_user(session, "founder4@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker4@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()

    updated = await team_service.respond_to_invitation(
        invitation["id"], seeker_id, "accepted", session=session
    )
    await session.commit()
    assert updated["status"] == "accepted"

    membership = await team_repo.get_membership(founder_id, seeker_id, session=session)
    assert membership is not None


@pytest.mark.asyncio
async def test_respond_to_invitation_declined(session):
    founder_id = await _make_user(session, "founder5@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker5@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()

    updated = await team_service.respond_to_invitation(
        invitation["id"], seeker_id, "declined", session=session
    )
    await session.commit()
    assert updated["status"] == "declined"

    membership = await team_repo.get_membership(founder_id, seeker_id, session=session)
    assert membership is None


@pytest.mark.asyncio
async def test_respond_to_invitation_boundaries(session):
    founder_id = await _make_user(session, "founder6@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker6@example.com", role="job_seeker")
    other_id = await _make_user(session, "other6@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()

    # Wrong invitee -> 404.
    with pytest.raises(HTTPException) as exc:
        await team_service.respond_to_invitation(
            invitation["id"], other_id, "accepted", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND

    # Invalid status -> 422.
    with pytest.raises(HTTPException) as exc:
        await team_service.respond_to_invitation(
            invitation["id"], seeker_id, "maybe", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Accept, then respond again -> already answered (409).
    await team_service.respond_to_invitation(
        invitation["id"], seeker_id, "accepted", session=session
    )
    await session.commit()
    with pytest.raises(HTTPException) as exc:
        await team_service.respond_to_invitation(
            invitation["id"], seeker_id, "declined", session=session
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT


# ── Listings and removal ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_invitations_and_members(session):
    founder_id = await _make_user(session, "founder7@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker7@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()

    founder_invites = await team_service.list_invitations(founder_id, True, session=session)
    assert len(founder_invites) == 1
    assert founder_invites[0]["status"] == "pending"

    seeker_invites = await team_service.list_invitations(seeker_id, False, session=session)
    assert len(seeker_invites) == 1

    # No members yet (invitation pending).
    members = await team_service.list_members(founder_id, session=session)
    assert members == []


@pytest.mark.asyncio
async def test_remove_team_member(session):
    founder_id = await _make_user(session, "founder8@example.com", role="founder")
    seeker_id = await _make_user(session, "seeker8@example.com", role="job_seeker")
    await _make_job_seeker(session, seeker_id)

    invitation = await team_service.create_invitation(
        founder_id=founder_id, invitee_id=seeker_id, session=session
    )
    await session.commit()
    await team_service.respond_to_invitation(
        invitation["id"], seeker_id, "accepted", session=session
    )
    await session.commit()

    members = await team_service.list_members(founder_id, session=session)
    assert len(members) == 1

    await team_service.remove_member(founder_id, seeker_id, session=session)
    await session.commit()

    members = await team_service.list_members(founder_id, session=session)
    assert members == []

    # Removing again -> 404.
    with pytest.raises(HTTPException) as exc:
        await team_service.remove_member(founder_id, seeker_id, session=session)
    await session.commit()
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND
