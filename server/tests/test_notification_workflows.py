from __future__ import annotations

import pytest
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from models.base import Base
from models.investor_profile import InvestorProfile
from models.conversation import Conversation
from models.message import Message
from repositories import conversation as conversation_repo
from repositories import notification as notification_repo
from repositories import user as user_repo


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
    created = await user_repo.create_user(
        email=email,
        hashed_password="test",
        full_name="Notification Test",
        role=role,
        session=session,
    )
    await session.flush()
    return created["id"]


@pytest.mark.asyncio
async def test_notification_preferences_only_apply_to_investors(session):
    provider_id = await _user(session, "provider-alerts@example.com", "INFRASTRUCTURE_PROVIDER")
    investor_id = await _user(session, "investor-alerts@example.com", "investor")
    session.add(InvestorProfile(user_id=investor_id, notify_messages=False))
    await session.flush()

    provider_notification = await notification_repo.create_notification(
        provider_id, "message", "New message", "Hello", session=session
    )
    investor_notification = await notification_repo.create_notification(
        investor_id, "message", "New message", "Hello", session=session
    )

    assert provider_notification["id"] is not None
    assert investor_notification == {}


@pytest.mark.asyncio
async def test_unsupported_notification_types_are_not_persisted(session):
    user_id = await _user(session, "unknown-alerts@example.com", "founder")

    result = await notification_repo.create_notification(
        user_id, "payment", "Payment", "Payment completed", session=session
    )
    items, total = await notification_repo.list_notifications(user_id, session=session)

    assert result == {}
    assert items == []
    assert total == 0


@pytest.mark.asyncio
async def test_notification_listing_returns_filtered_total_and_paginates(session):
    user_id = await _user(session, "pagination-alerts@example.com", "founder")
    for index in range(3):
        await notification_repo.create_notification(
            user_id, "order", f"Order {index}", "Update", session=session
        )
    await session.flush()

    items, total = await notification_repo.list_notifications(
        user_id, limit=2, offset=1, session=session
    )

    assert len(items) == 2
    assert total == 3


@pytest.mark.asyncio
async def test_unread_conversation_summary_counts_all_inbox_pages(session):
    user_id = await _user(session, "inbox-owner@example.com", "FOUNDER")
    sender_one = await _user(session, "inbox-sender-one@example.com", "INVESTOR")
    sender_two = await _user(session, "inbox-sender-two@example.com", "EXPERT")
    conversation_one = Conversation(
        participant_a_id=min(user_id, sender_one),
        participant_b_id=max(user_id, sender_one),
    )
    conversation_two = Conversation(
        participant_a_id=min(user_id, sender_two),
        participant_b_id=max(user_id, sender_two),
    )
    session.add_all([conversation_one, conversation_two])
    await session.flush()

    session.add_all([
        Message(conversation_id=conversation_one.id, sender_id=sender_one, body="Unread one"),
        Message(conversation_id=conversation_one.id, sender_id=user_id, body="My reply"),
        Message(
            conversation_id=conversation_one.id,
            sender_id=sender_one,
            body="Already read",
            read_at=datetime.now(timezone.utc),
        ),
        Message(conversation_id=conversation_two.id, sender_id=sender_two, body="Unread two"),
    ])
    await session.flush()

    assert await conversation_repo.count_unread_conversations(user_id, session=session) == 2
    assert await conversation_repo.count_unread_conversations(sender_one, session=session) == 1

