from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.base import Base
from repositories import user as user_repo
from services import investor as investor_service


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


async def _user(session: AsyncSession, email: str, role: str) -> int:
    user = await user_repo.create_user(
        email=email, hashed_password="test", full_name="Pitch Test", role=role, session=session
    )
    await session.flush()
    return user["id"]


async def _pitch(session: AsyncSession, founder_id: int) -> dict:
    return await investor_service.create_startup_pitch(
        founder_id=founder_id,
        title="Test venture",
        summary="A clear problem and solution.",
        sector="fintech",
        stage="pre-seed",
        ask_amount=10000,
        location="Nairobi, Kenya",
        session=session,
    )


@pytest.mark.asyncio
async def test_new_pitch_is_draft_and_hidden_from_investors(session):
    founder_id = await _user(session, "pitch-founder@example.com", "FOUNDER")
    investor_id = await _user(session, "pitch-investor@example.com", "INVESTOR")
    pitch = await _pitch(session, founder_id)

    assert pitch["status"] == "draft"
    assert await investor_service.list_all_pitches(investor_id, session=session) == {"items": [], "total": 0}
    with pytest.raises(HTTPException) as exc:
        await investor_service.create_investment_request(investor_id, pitch["id"], session=session)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_only_complete_pitch_can_be_published(session):
    founder_id = await _user(session, "incomplete-founder@example.com", "FOUNDER")
    pitch = await investor_service.create_startup_pitch(founder_id, "Incomplete", session=session)

    with pytest.raises(HTTPException) as exc:
        await investor_service.publish_founder_pitch(pitch["id"], founder_id, session=session)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_published_pitch_is_discoverable_and_editing_unpublishes(session):
    founder_id = await _user(session, "published-founder@example.com", "FOUNDER")
    investor_id = await _user(session, "published-investor@example.com", "INVESTOR")
    pitch = await _pitch(session, founder_id)

    published = await investor_service.publish_founder_pitch(pitch["id"], founder_id, session=session)
    assert published["status"] == "active"
    visible = await investor_service.list_all_pitches(investor_id, session=session)
    assert visible["total"] == 1
    assert visible["items"][0]["id"] == pitch["id"]

    edited = await investor_service.update_founder_pitch(
        pitch["id"], founder_id, session=session, summary="Updated summary"
    )
    assert edited["status"] == "draft"
    assert await investor_service.list_all_pitches(investor_id, session=session) == {"items": [], "total": 0}
