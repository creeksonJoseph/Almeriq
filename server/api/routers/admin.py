"""api/routers/admin.py - Admin endpoints for administrative operations."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from core.db import async_session_factory, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from models.waitlist import Waitlist
from api.dependencies import get_current_admin_user
from repositories import user as user_repo
from repositories import provider_profile as provider_repo

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_USER_ROLES = {
    "ADMIN",
    "FOUNDER",
    "INVESTOR",
    "JOB_SEEKER",
    "INFRASTRUCTURE_PROVIDER",
}


class AdminRoleUpdateRequest(BaseModel):
    role: str


def _normalize_role(role: str) -> str:
    normalized = role.strip().upper().replace(" ", "_")
    if normalized not in VALID_USER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be ADMIN, FOUNDER, INVESTOR, JOB_SEEKER, or INFRASTRUCTURE_PROVIDER",
        )
    return normalized


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


@router.patch("/me/role", status_code=200)
async def update_user_role(
    body: AdminRoleUpdateRequest,
    admin_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Admin only: switch the currently logged-in admin's test role."""
    role = _normalize_role(body.role)
    updated_user = await user_repo.update_user_role(
        user_id=admin_user["id"],
        role=role,
        session=db,
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Your account could not be updated",
        )

    if role == "INFRASTRUCTURE_PROVIDER":
        profile = await provider_repo.get_provider_profile_by_user_id(
            admin_user["id"],
            session=db,
        )
        if not profile:
            await provider_repo.create_provider_profile(
                user_id=admin_user["id"],
                company_name=updated_user.get("full_name") or "Test Provider",
                session=db,
            )

    await db.commit()
    return {"message": "Your test role was updated", "user": updated_user}
