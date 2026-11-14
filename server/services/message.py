"""services/message.py - Business logic for messages."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import conversation as conversation_repo
from repositories import message as message_repo

logger = logging.getLogger(__name__)


async def list_messages(
    conversation_id: int,
    user_id: int,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List messages for a conversation (user must be a participant)."""
    conversation = await conversation_repo.get_conversation_by_id(
        conversation_id, user_id, session=session
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return await message_repo.list_messages(
        conversation_id, user_id, limit=limit, offset=offset, session=session
    )


async def create_message(
    conversation_id: int,
    sender_id: int,
    body: str,
    session: AsyncSession | None = None,
) -> dict:
    """Create a message in a conversation (sender must be a participant)."""
    conversation = await conversation_repo.get_conversation_by_id(
        conversation_id, sender_id, session=session
    )
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    message = await message_repo.create_message(
        conversation_id, sender_id, body, session=session
    )
    await conversation_repo.update_conversation_timestamp(conversation_id, session=session)
    return message
