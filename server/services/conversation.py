"""services/conversation.py - Business logic for conversations."""
from __future__ import annotations
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import conversation as conversation_repo

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
