from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.dependencies import get_current_user
from core.db import get_db
from services import investor as svc
from schemas.investor import InvestorProfileUpdateRequest

router = APIRouter(prefix="/api", tags=["investor"])


def _require_role(current_user: dict, expected: str) -> int:
    if str(current_user.get("role", "")).lower() != expected:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"{expected.capitalize()} account required",
        )
    return current_user["id"]


@router.get("/investor/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = _require_role(current_user, "investor")
    return await svc.get_investor_profile(user_id=user_id, session=db)


@router.put("/investor/profile")
async def update_profile(
    body: InvestorProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = _require_role(current_user, "investor")
    return await svc.upsert_investor_profile(
        user_id=user_id,
        session=db,
        **body.model_dump(exclude_unset=True),
    )


# Founder-owned startup pitches


@router.post("/founder/pitches", status_code=status.HTTP_201_CREATED)
async def create_pitch(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    return await svc.create_startup_pitch(
        founder_id=founder_id,
        session=db,
        **body,
    )


@router.get("/founder/pitches")
async def list_my_pitches(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.list_founder_pitches(founder_id=founder_id, session=db)


@router.get("/founder/pitches/{pitch_id}")
async def get_pitch(
    response: Response,
    pitch_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_founder_pitch(
        pitch_id=pitch_id,
        founder_id=founder_id,
        session=db,
    )


@router.put("/founder/pitches/{pitch_id}")
async def update_pitch(
    response: Response,
    pitch_id: int,
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "no-store"
    return await svc.update_founder_pitch(
        pitch_id=pitch_id,
        founder_id=founder_id,
        session=db,
        **body,
    )


@router.delete(
    "/founder/pitches/{pitch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pitch(
    response: Response,
    pitch_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    founder_id = _require_role(current_user, "founder")
    response.headers["Cache-Control"] = "no-store"
    await svc.delete_founder_pitch(
        pitch_id=pitch_id,
        founder_id=founder_id,
        session=db,
    )


@router.get("/investor/startups")
@router.get("/investor/pitches")
async def list_investor_pitches(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    _require_role(current_user, "investor")
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.list_all_pitches(
        limit=limit,
        offset=offset,
        session=db,
    )
