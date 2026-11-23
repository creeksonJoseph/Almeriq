from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from core.db import get_db
from schemas.team import TeamInvitationCreate, TeamInvitationResponse
from services import team as svc

router = APIRouter(prefix="/api", tags=["teams"])


def _require_role(user: dict, expected: str) -> int:
    if str(user.get("role", "")).lower() != expected:
        raise HTTPException(status_code=403, detail=f"{expected.replace('_', ' ').capitalize()} account required")
    return int(user["id"])


@router.get("/founder/talent")
async def discover_talent(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    query: str | None = Query(default=None, max_length=120),
    role: str | None = Query(default=None, max_length=120),
    location: str | None = Query(default=None, max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "private, no-store"
    return await svc.discover_talent(query, role, location, limit, offset, session=db)


@router.get("/founder/talent/{user_id}")
async def get_talent_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_role(current_user, "founder")
    return await svc.get_talent_profile(user_id, session=db)


@router.post("/founder/team/invitations", status_code=status.HTTP_201_CREATED)
async def invite_talent(
    body: TeamInvitationCreate,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_invitation(founder_id, body.invitee_id, body.message, session=db)


@router.get("/founder/team/invitations")
async def list_founder_invitations(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "private, no-store"
    return {"items": await svc.list_invitations(founder_id, True, session=db)}


@router.get("/founder/team/members")
async def list_team_members(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "private, no-store"
    return {"items": await svc.list_members(founder_id, session=db)}


@router.delete("/founder/team/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_member(
    member_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    await svc.remove_member(founder_id, member_id, session=db)


@router.get("/job-seeker/team-invitations")
async def list_job_seeker_invitations(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = _require_role(current_user, "job_seeker")
    response.headers["Cache-Control"] = "private, no-store"
    return {"items": await svc.list_invitations(user_id, False, session=db)}


@router.patch("/job-seeker/team-invitations/{invitation_id}")
async def respond_to_team_invitation(
    invitation_id: int,
    body: TeamInvitationResponse,
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = _require_role(current_user, "job_seeker")
    response.headers["Cache-Control"] = "no-store"
    return await svc.respond_to_invitation(invitation_id, user_id, body.status, session=db)
