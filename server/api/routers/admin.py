"""api/routers/admin.py - Admin endpoints for administrative operations."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from core.db import async_session_factory
from models.waitlist import Waitlist
from api.dependencies import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/waitlist", status_code=200)
async def get_waitlist_participants(
    admin_user: dict = Depends(get_current_admin_user),
    response: Response = None,
) -> dict:
    """
    GET /admin/waitlist
    Admin only: Fetch all waitlist signups with timestamps, roles, and status.
    """
    if response:
        response.headers["Cache-Control"] = "no-store"

    async with async_session_factory() as session:
        stmt = select(Waitlist).order_by(Waitlist.joined_at.desc())
        result = await session.scalars(stmt)
        entries = [w.to_dict() for w in result.all()]

    return {
        "total": len(entries),
        "items": entries,
    }
