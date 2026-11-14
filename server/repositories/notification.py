"""repositories/notification.py - SQLAlchemy 2.0 repository for Notification model."""
from __future__ import annotations
import logging
from sqlalchemy import select, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.notification import Notification

logger = logging.getLogger(__name__)


async def create_notification(
    user_id: int,
    type: str,
    title: str,
    body: str,
    link: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new notification."""
    logger.info(f"[REPO-CREATE-NOTIFICATION] Starting: user_id={user_id}, type={type}")
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
    )

    if session is not None:
        session.add(notification)
        await session.flush()
        return notification.to_dict()

    async with async_session_factory() as s:
        s.add(notification)
        await s.commit()
        await s.refresh(notification)
        return notification.to_dict()


async def list_notifications(
    user_id: int,
    unread_only: bool = False,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List notifications for a user."""
    stmt = select(Notification).where(Notification.user_id == user_id)
    count_stmt = select(func.count()).select_from(Notification).where(Notification.user_id == user_id)

    if unread_only:
        stmt = stmt.where(Notification.read == False)
        count_stmt = count_stmt.where(Notification.read == False)

    stmt = stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)

    if session is not None:
        result = await session.execute(stmt)
        notifications = result.scalars().all()
        count = await session.scalar(count_stmt)
        return [n.to_dict() for n in notifications], count or 0

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        notifications = result.scalars().all()
        count = await s.scalar(count_stmt)
        return [n.to_dict() for n in notifications], count or 0


async def mark_notification_read(
    notification_id: int,
    user_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Mark a notification as read."""
    stmt = (
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(read=True)
        .returning(Notification)
    )

    if session is not None:
        res = await session.execute(stmt)
        notification = res.scalar_one_or_none()
        return notification.to_dict() if notification else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        notification = res.scalar_one_or_none()
        return notification.to_dict() if notification else None


async def mark_all_notifications_read(
    user_id: int,
    session: AsyncSession | None = None,
) -> int:
    """Mark all notifications as read for a user."""
    stmt = (
        update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)
        .values(read=True)
    )

    if session is not None:
        res = await session.execute(stmt)
        return res.rowcount

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        return res.rowcount


async def get_unread_count(
    user_id: int,
    session: AsyncSession | None = None,
) -> int:
    """Get unread notification count for a user."""
    stmt = select(func.count()).select_from(Notification).where(
        Notification.user_id == user_id,
        Notification.read == False,
    )

    if session is not None:
        count = await session.scalar(stmt)
        return count or 0

    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        return count or 0