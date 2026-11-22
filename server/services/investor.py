from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import investor_profile as profile_repo
from repositories import startup_pitch as pitch_repo

logger = logging.getLogger(__name__)


async def get_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    profile = await profile_repo.get_investor_profile_by_user_id(
        user_id, session=session
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor profile not found",
        )
    return profile


async def create_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    existing = await profile_repo.get_investor_profile_by_user_id(
        user_id, session=session
    )
    if existing:
        return existing
    return await profile_repo.create_investor_profile(user_id=user_id, session=session)


async def create_startup_pitch(
    founder_id: int,
    title: str,
    session: AsyncSession | None = None,
    summary: str | None = None,
    sector: str | None = None,
    stage: str | None = None,
    ask_amount: float | None = None,
) -> dict:
    if not title or not title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pitch title is required",
        )
    if ask_amount is not None and ask_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ask_amount cannot be negative",
        )
    return await pitch_repo.create_startup_pitch(
        founder_id=founder_id,
        title=title.strip(),
        summary=summary,
        sector=sector,
        stage=stage,
        ask_amount=ask_amount,
        session=session,
    )


async def list_founder_pitches(
    founder_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    return await pitch_repo.list_startup_pitches(
        founder_id=founder_id, session=session
    )


async def get_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
) -> dict:
    pitch = await pitch_repo.get_startup_pitch(
        pitch_id, founder_id=founder_id, session=session
    )
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )
    return pitch


async def update_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    if "title" in values and values["title"] is not None:
        values["title"] = values["title"].strip()
        if not values["title"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Pitch title cannot be empty",
            )
    if values.get("ask_amount") is not None and values["ask_amount"] < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ask_amount cannot be negative",
        )
    pitch = await pitch_repo.update_startup_pitch(
        pitch_id, founder_id, session=session, **values
    )
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )
    return pitch


async def delete_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
) -> None:
    deleted = await pitch_repo.delete_startup_pitch(
        pitch_id, founder_id, session=session
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )


async def list_all_pitches(
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> dict:
    items = await pitch_repo.list_startup_pitches(
        limit=limit, offset=offset, session=session
    )
    total = await pitch_repo.count_startup_pitches(session=session)
    return {"items": items, "total": total}
