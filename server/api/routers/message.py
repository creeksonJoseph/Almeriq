"""api/routers/message.py - Message endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from schemas.provider import MessageListResponse, MessageResponse, MessageCreateRequest
from services import message as svc

router = APIRouter(prefix="/api", tags=["messages"])


@router.get("/conversations/{conversation_id}/messages", response_model=MessageListResponse)
async def list_messages(
    response: Response,
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
) -> dict:
    """List messages for a conversation the current user participates in."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items = await svc.list_messages(
        conversation_id=conversation_id,
        user_id=current_user["id"],
        limit=limit,
        offset=offset,
        session=db,
    )
    return {"items": items}


@router.post(
    "/conversations/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
    response_model=MessageResponse,
)
async def create_message(
    response: Response,
    conversation_id: int,
    body: MessageCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Send a message in a conversation the current user participates in."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_message(
        conversation_id=conversation_id,
        sender_id=current_user["id"],
        body=body.body,
        session=db,
    )
