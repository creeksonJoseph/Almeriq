from __future__ import annotations
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from services import investor as svc

router = APIRouter(prefix="/api", tags=["investor"])


@router.get("/investor/profile")
async def get_profile(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await svc.get_investor_profile(user_id=current_user["id"], session=db)


# ── Startup Pitches (founder-created) ──────────────────────────────────────────

@router.post("/founder/pitches", status_code=status.HTTP_201_CREATED)
async def create_pitch(
    body: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await svc.create_startup_pitch(
        founder_id=current_user["id"],
        session=db,
        **body,
    )


@router.get("/founder/pitches")
async def list_my_pitches(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.list_founder_pitches(
        founder_id=current_user["id"],
        session=db,
    )


@router.get("/founder/pitches/{pitch_id}")
async def get_pitch(
    response: Response,
    pitch_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_founder_pitch(
        pitch_id=pitch_id,
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
    response.headers["Cache-Control"] = "no-store"
    data = body
    return await svc.update_founder_pitch(
        pitch_id=pitch_id,
        founder_id=current_user["id"],
        session=db,
        **data,
    )


@router.delete("/founder/pitches/{pitch_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pitch(
    response: Response,
    pitch_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "no-store"
    await svc.delete_founder_pitch(
        pitch_id=pitch_id,
        founder_id=current_user["id"],
        session=db,
    )


@router.get("/investor/pitches")
async def list_investor_pitches(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.list_all_pitches(
        limit=limit,
        offset=offset,
        session=db,
    )
