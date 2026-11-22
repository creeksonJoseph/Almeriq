"""services/message.py - Business logic for messages."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import conversation as conversation_repo
from repositories import message as message_repo
from repositories import notification as notification_repo
from repositories import user as user_repo

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
    messages = await message_repo.list_messages(
        conversation_id, user_id, limit=limit, offset=offset, session=session
    )
    for message in messages:
        sender = await user_repo.get_user_by_id(message["sender_id"], session=session)
        if sender:
            message["sender"] = {
                "id": sender["id"],
                "email": sender["email"],
                "full_name": sender.get("full_name"),
                "role": sender["role"],
                "is_admin": sender.get("is_admin", False),
            }
    return messages


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
    recipient_id = (
        conversation["participant_b_id"]
        if conversation["participant_a_id"] == sender_id
        else conversation["participant_a_id"]
    )
    await notification_repo.create_notification(
        user_id=recipient_id,
        type="message",
        title="New message",
        body=body[:180],
        link=f"/messages?conversation={conversation_id}",
        session=session,
    )
    await conversation_repo.update_conversation_timestamp(conversation_id, session=session)
    return message
