"""repositories/message.py - SQLAlchemy 2.0 repository for Message model."""
from __future__ import annotations
import logging
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.message import Message

logger = logging.getLogger(__name__)


async def create_message(
    conversation_id: int,
    sender_id: int,
    body: str,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new message."""
    logger.info(f"[REPO-CREATE-MESSAGE] Starting: conversation_id={conversation_id}, sender_id={sender_id}")
    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        body=body,
    )

    if session is not None:
        session.add(message)
        await session.flush()
        return message.to_dict()

    async with async_session_factory() as s:
        s.add(message)
        await s.commit()
        await s.refresh(message)
        return message.to_dict()


async def list_messages(
    conversation_id: int,
    user_id: int,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List messages for a conversation (user must be participant)."""
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .offset(offset)
    )

    if session is not None:
        result = await session.execute(stmt)
        messages = result.scalars().all()
        return [m.to_dict() for m in messages]

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        messages = result.scalars().all()
        return [m.to_dict() for m in messages]


async def mark_messages_read(
    conversation_id: int,
    user_id: int,
    session: AsyncSession | None = None,
) -> int:
    """Mark all unread messages in a conversation as read for a user."""
    from datetime import datetime, timezone

    stmt = (
        update(Message)
        .where(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.read_at.is_(None),
        )
        .values(read_at=datetime.now(timezone.utc))
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
    """Get total unread message count for a user across all conversations."""
    stmt = (
        select(func.count())
        .select_from(Message)
        .join(Message.conversation)
        .where(
            (Message.sender_id != user_id) &
            Message.read_at.is_(None) & (
                (Conversation.participant_a_id == user_id) |
                (Conversation.participant_b_id == user_id)
            )
        )
    )

    if session is not None:
        count = await session.scalar(stmt)
        return count or 0

    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        return count or 0