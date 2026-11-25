from __future__ import annotations

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.base import Base
from repositories import notification as notification_repo
from repositories import user as user_repo
from services import investor as investor_service
from services import investor_update as update_service


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
    user = await user_repo.create_user(email=email, hashed_password="test", full_name="Update Test", role=role, session=session)
    await session.flush()
    return user["id"]


async def _published_pitch(session: AsyncSession, founder_id: int) -> dict:
    pitch = await investor_service.create_startup_pitch(
        founder_id, "Update Test Venture", summary="Summary", sector="fintech",
        stage="seed", ask_amount=25000, location="Nairobi", session=session,
    )
    return await investor_service.publish_founder_pitch(pitch["id"], founder_id, session=session)


@pytest.mark.asyncio
async def test_founder_update_is_shared_only_with_connected_investors(session):
    founder_id = await _user(session, "update-founder@example.com", "FOUNDER")
    investor_id = await _user(session, "update-investor@example.com", "INVESTOR")
    pitch = await _published_pitch(session, founder_id)
    request = await investor_service.create_investment_request(investor_id, pitch["id"], session=session)
    await investor_service.update_founder_request(request["id"], founder_id, "accepted", session=session)

    draft = await update_service.create_founder_update(
        founder_id, pitch["id"], "November 2026", "Product launch and customer progress.",
        session=session,
    )
    assert draft["status"] == "draft"
    published = await update_service.publish_founder_update(draft["id"], founder_id, session=session)
    assert published["status"] == "published"

    investor_updates = await update_service.list_investor_updates(investor_id, session=session)
    assert len(investor_updates) == 1
    assert investor_updates[0]["id"] == draft["id"]
    notifications, total = await notification_repo.list_notifications(investor_id, session=session)
    assert total >= 1
    assert any(item["title"] == "New update from Update Test Venture" for item in notifications)


@pytest.mark.asyncio
async def test_pending_interest_does_not_grant_investor_update_access(session):
    founder_id = await _user(session, "pending-founder@example.com", "FOUNDER")
    investor_id = await _user(session, "pending-investor@example.com", "INVESTOR")
    pitch = await _published_pitch(session, founder_id)
    await investor_service.create_investment_request(investor_id, pitch["id"], session=session)
    draft = await update_service.create_founder_update(
        founder_id, pitch["id"], "November 2026", "Private update draft.",
        session=session,
    )
    with pytest.raises(HTTPException) as exc:
        await update_service.publish_founder_update(draft["id"], founder_id, session=session)
    assert exc.value.status_code == 409
    assert await update_service.list_investor_updates(investor_id, session=session) == []


@pytest.mark.asyncio
async def test_founder_cannot_update_another_founders_pitch_updates(session):
    owner_id = await _user(session, "owner-founder@example.com", "FOUNDER")
    other_id = await _user(session, "other-founder@example.com", "FOUNDER")
    pitch = await _published_pitch(session, owner_id)
    with pytest.raises(HTTPException) as exc:
        await update_service.create_founder_update(
            other_id, pitch["id"], "November 2026", "Unauthorized content", session=session
        )
    assert exc.value.status_code == 404
