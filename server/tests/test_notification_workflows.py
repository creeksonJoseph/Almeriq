from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.investor_profile import InvestorProfile
from repositories import notification as notification_repo
from repositories import user as user_repo


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
