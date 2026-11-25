"""api/routers/admin.py - Admin endpoints for administrative operations."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from core.db import async_session_factory, get_db
from core.roles import normalize_role
from sqlalchemy.ext.asyncio import AsyncSession
from models.waitlist import Waitlist
from api.dependencies import get_current_admin_user
from repositories import user as user_repo
from repositories import provider_profile as provider_repo

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_USER_ROLES = {
    "admin",
    "founder",
    "investor",
    "job_seeker",
    "infrastructure_provider",
    "expert",
}


class AdminRoleUpdateRequest(BaseModel):
    role: str


class ProviderVerificationUpdateRequest(BaseModel):
    verified: bool


def _normalize_role(role: str) -> str:
    normalized = normalize_role(role)
    if normalized not in VALID_USER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be admin, founder, investor, job_seeker, infrastructure_provider, or expert",
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


@router.get("/providers", status_code=200)
async def list_provider_review_queue(
    verified: bool | None = None,
    limit: int = 100,
    offset: int = 0,
    admin_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List provider profiles for admin verification review."""
    items = await provider_repo.list_provider_profiles(
        verified=verified, limit=min(max(limit, 1), 100), offset=max(offset, 0), session=db
    )
    return {"items": items}


@router.get("/providers/{provider_id}/verification-history", status_code=200)
async def get_provider_verification_history(
    provider_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    admin_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Return the append-only verification and revocation history for a provider."""
    profile = await provider_repo.get_provider_profile_by_id(provider_id, session=db)
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    items = await provider_repo.list_provider_verification_events(
        profile_id=provider_id, limit=limit, offset=offset, session=db
    )
    return {"items": items}


@router.patch("/providers/{provider_id}/verification", status_code=200)
async def update_provider_verification(
    provider_id: int,
    body: ProviderVerificationUpdateRequest,
    admin_user: dict = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Verify or revoke verification for a provider profile."""
    profile = await provider_repo.update_provider_verification(
        profile_id=provider_id, verified=body.verified, verified_by=admin_user["id"], session=db
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    await db.commit()
    return {"message": "Provider verification updated", "provider": profile}


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

    if role == "infrastructure_provider":
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
