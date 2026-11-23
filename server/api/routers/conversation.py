"""api/routers/conversation.py - Conversation endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from schemas.provider import ConversationListResponse
from services import conversation as svc

router = APIRouter(prefix="/api", tags=["conversations"])


@router.post("/conversations/with-provider/{provider_id}")
async def start_provider_conversation(provider_id: int, response: Response, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    response.headers["Cache-Control"] = "no-store"
    return await svc.start_provider_conversation(provider_id=provider_id, user_id=current_user["id"], session=db)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List conversations for the current user."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items = await svc.list_conversations(
        user_id=current_user["id"],
        limit=limit,
        offset=offset,
        session=db,
    )
    return {"items": items}


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    response: Response,
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    conversation = await svc.get_conversation(
        conversation_id=conversation_id,
        user_id=current_user["id"],
        session=db,
    )
    response.headers["Cache-Control"] = "private, max-age=30"
    return conversation


@router.post("/conversations/{conversation_id}/read")
async def mark_conversation_read(
    response: Response,
    conversation_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    count = await svc.mark_conversation_read(
        conversation_id=conversation_id,
        user_id=current_user["id"],
        session=db,
    )
    response.headers["Cache-Control"] = "no-store"
    return {"marked": count}


@router.post("/advisory-requests/{request_id}/conversation")
async def start_advisory_conversation(
    request_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Start messaging with the other party after an advisory request is accepted."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.start_advisory_conversation(
        request_id=request_id, user_id=current_user["id"], session=db
    )


@router.post("/investment-requests/{investment_id}/conversation")
async def start_investment_conversation(
    investment_id: int,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Start messaging with the other party after an investor request is accepted."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.start_investment_conversation(
        investment_id=investment_id, user_id=current_user["id"], session=db
    )
