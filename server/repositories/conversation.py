"""repositories/conversation.py - SQLAlchemy 2.0 repository for Conversation model."""
from __future__ import annotations
import logging
from sqlalchemy import select, func, or_, and_, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.conversation import Conversation
from models.message import Message

logger = logging.getLogger(__name__)


async def get_or_create_conversation(
    participant_a_id: int,
    participant_b_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get existing conversation between two users or create a new one.
    
    Orders participant IDs to ensure uniqueness regardless of order.
    """
    # Ensure consistent ordering
    a, b = sorted([participant_a_id, participant_b_id])

    stmt = select(Conversation).where(
        Conversation.participant_a_id == a,
        Conversation.participant_b_id == b,
    ).limit(1)

    if session is not None:
        conversation = await session.scalar(stmt)
        if conversation:
            return conversation.to_dict()

        conversation = Conversation(participant_a_id=a, participant_b_id=b)
        session.add(conversation)
        await session.flush()
        return conversation.to_dict()

    async with async_session_factory() as s:
        conversation = await s.scalar(stmt)
        if conversation:
            return conversation.to_dict()

        conversation = Conversation(participant_a_id=a, participant_b_id=b)
        s.add(conversation)
        await s.commit()
        await s.refresh(conversation)
        return conversation.to_dict()


async def get_conversation_by_id(
    conversation_id: int,
    user_id: int,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch conversation by id, ensuring user is a participant."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        or_(
            Conversation.participant_a_id == user_id,
            Conversation.participant_b_id == user_id,
        ),
    ).limit(1)

    if session is not None:
        conversation = await session.scalar(stmt)
        return conversation.to_dict() if conversation else None

    async with async_session_factory() as s:
        conversation = await s.scalar(stmt)
        return conversation.to_dict() if conversation else None


async def list_user_conversations(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all conversations for a user with last message and unread count."""
    # Subquery for last message per conversation
    last_message_subq = (
        select(
            Message.conversation_id,
            func.max(Message.created_at).label("last_message_at"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    # Subquery for unread count per conversation
    unread_subq = (
        select(
            Message.conversation_id,
            func.count().label("unread_count"),
        )
        .where(
            Message.sender_id != user_id,
            Message.read_at.is_(None),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    stmt = (
        select(
            Conversation,
            last_message_subq.c.last_message_at,
            unread_subq.c.unread_count,
        )
        .where(
            or_(
                Conversation.participant_a_id == user_id,
                Conversation.participant_b_id == user_id,
            )
        )
        .outerjoin(last_message_subq, Conversation.id == last_message_subq.c.conversation_id)
        .outerjoin(unread_subq, Conversation.id == unread_subq.c.conversation_id)
        .order_by(last_message_subq.c.last_message_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )

    if session is not None:
        result = await session.execute(stmt)
        return [
            {
                **conv.to_dict(),
                "last_message_at": last_msg_at,
                "unread_count": unread_count or 0,
            }
            for conv, last_msg_at, unread_count in result.all()
        ]

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        return [
            {
                **conv.to_dict(),
                "last_message_at": last_msg_at,
                "unread_count": unread_count or 0,
            }
            for conv, last_msg_at, unread_count in result.all()
        ]


async def update_conversation_timestamp(
    conversation_id: int,
    session: AsyncSession | None = None,
) -> None:
    """Update conversation updated_at timestamp."""
    from datetime import datetime, timezone

    stmt = (
        update(Conversation)
        .where(Conversation.id == conversation_id)
        .values(updated_at=datetime.now(timezone.utc))
    )

    if session is not None:
        await session.execute(stmt)
    else:
        async with async_session_factory() as s:
            await s.execute(stmt)
            await s.commit()