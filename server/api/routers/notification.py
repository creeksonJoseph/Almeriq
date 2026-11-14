"""api/routers/notification.py - Notification endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from schemas.provider import NotificationListResponse, NotificationResponse
from services import notification as svc

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    unread_only: bool = Query(default=False),
) -> dict:
    """List notifications for the current user."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items, unread_count = await svc.list_notifications(
        user_id=current_user["id"],
        unread_only=unread_only,
        session=db,
    )
    return {"items": items, "unread_count": unread_count}


@router.patch("/notifications/read-all")
async def mark_all_notifications_read(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark all notifications as read for the current user."""
    response.headers["Cache-Control"] = "no-store"
    result = await svc.mark_all_notifications_read(
        user_id=current_user["id"],
        session=db,
    )
    return result
