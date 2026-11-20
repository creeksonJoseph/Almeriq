"""services/conversation.py - Business logic for conversations."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import conversation as conversation_repo
from repositories import message as message_repo
from repositories import provider_profile as provider_repo

logger = logging.getLogger(__name__)


async def list_conversations(
    user_id: int,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List conversations for a user with last message and unread count."""
    return await conversation_repo.list_user_conversations(
        user_id, limit=limit, offset=offset, session=session
    )


async def start_provider_conversation(provider_id: int, user_id: int, session: AsyncSession | None = None) -> dict:
    profile = await provider_repo.get_provider_profile_by_id(provider_id, session=session)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    if profile["user_id"] == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot message your own provider account")
    return await conversation_repo.get_or_create_conversation(user_id, profile["user_id"], session=session)


async def get_conversation(
    conversation_id: int,
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    conversation = await conversation_repo.get_conversation_by_id(
        conversation_id, user_id, session=session
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return conversation


async def mark_conversation_read(
    conversation_id: int,
    user_id: int,
    session: AsyncSession | None = None,
) -> int:
    conversation = await conversation_repo.get_conversation_by_id(
        conversation_id, user_id, session=session
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return await message_repo.mark_messages_read(conversation_id, user_id, session=session)
