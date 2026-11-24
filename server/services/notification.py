"""services/notification.py - Business logic for notifications."""
from __future__ import annotations
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import notification as notification_repo

logger = logging.getLogger(__name__)


async def list_notifications(
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List notifications for a user, returning items and total unread count."""
    items, total = await notification_repo.list_notifications(
        user_id,
        unread_only=unread_only,
        limit=limit,
        offset=offset,
        session=session,
    )
    unread_count = await notification_repo.get_unread_count(user_id, session=session)
    return items, total, unread_count


async def mark_notification_read(notification_id: int, user_id: int, session: AsyncSession | None = None) -> dict | None:
    return await notification_repo.mark_notification_read(notification_id, user_id, session=session)


async def mark_all_notifications_read(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Mark all notifications as read for a user."""
    count = await notification_repo.mark_all_notifications_read(user_id, session=session)
    return {"count": count}
