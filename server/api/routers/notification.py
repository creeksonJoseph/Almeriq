"""api/routers/notification.py - Notification endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from schemas.provider import NotificationListResponse, NotificationResponse
from services import notification as svc
from fastapi import HTTPException, status

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    unread_only: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    notification_type: str | None = Query(default=None, alias="type"),
) -> dict:
    """List notifications for the current user."""
    response.headers["Cache-Control"] = "private, no-cache"
    items, total, unread_count = await svc.list_notifications(
        user_id=current_user["id"],
        unread_only=unread_only,
        limit=limit,
        offset=offset,
        notification_type=notification_type,
        session=db,
    )
    return {"items": items, "total": total, "unread_count": unread_count}


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(notification_id: int, response: Response, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    response.headers["Cache-Control"] = "no-store"
    notification = await svc.mark_notification_read(notification_id, current_user["id"], session=db)
    if not notification:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notification


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
