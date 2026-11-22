from __future__ import annotations


from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import investor_profile as profile_repo
from repositories import startup_pitch as pitch_repo
from repositories import notification as notification_repo



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


async def get_investor_pitch(pitch_id: int, session: AsyncSession | None = None) -> dict:
    pitch = await pitch_repo.get_startup_pitch(pitch_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    return pitch


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


async def upsert_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    """Create or update the authenticated investor's public profile."""
    return await profile_repo.upsert_investor_profile(
        user_id=user_id,
        session=session,
        **values,
    )


async def create_investment_request(
    investor_id: int,
    pitch_id: int,
    amount: float | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create an expression-of-interest record; this does not transfer funds."""
    from repositories import investment as investment_repo

    pitch = await pitch_repo.get_startup_pitch(pitch_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    if pitch["founder_id"] == investor_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot express interest in your own startup pitch")
    if amount is not None and amount < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Amount must be non-negative")
    existing = await investment_repo.list_investments(investor_id=investor_id, session=session)
    if any(item["pitch_id"] == pitch_id for item in existing):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already contacted this founder about the pitch")
    request = await investment_repo.create_investment(
        investor_id=investor_id, pitch_id=pitch_id, amount=amount, session=session
    )
    if pitch.get("founder_id") != investor_id:
        await notification_repo.create_notification(
            user_id=pitch["founder_id"],
            type="investment",
            title="New investor interest",
            body="An investor has expressed interest in your startup pitch.",
            link="/founder/pitches",
            session=session,
        )
    return request


async def list_investor_requests(investor_id: int, session: AsyncSession | None = None) -> list[dict]:
    from repositories import investment as investment_repo
    return await investment_repo.list_investments(investor_id=investor_id, session=session)


async def get_investor_request(investment_id: int, investor_id: int, session: AsyncSession | None = None) -> dict:
    from repositories import investment as investment_repo
    item = await investment_repo.get_investment(investment_id, session=session)
    if not item or item["investor_id"] != investor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return item


async def list_founder_requests(founder_id: int, session: AsyncSession | None = None) -> list[dict]:
    from repositories import investment as investment_repo
    items = await investment_repo.list_investments(founder_id=founder_id, session=session)
    for item in items:
        investor_profile = await profile_repo.get_investor_profile_by_user_id(
            item["investor_id"], session=session
        )
        item["investor_name"] = (
            investor_profile.get("firm_name") if investor_profile else None
        ) or f"Investor #{item['investor_id']}"
    return items


async def update_founder_request(
    investment_id: int,
    founder_id: int,
    status_value: str,
    session: AsyncSession | None = None,
) -> dict:
    from repositories import investment as investment_repo
    if status_value not in {"accepted", "declined", "in_discussion"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be accepted, declined, or in_discussion")
    item = await investment_repo.get_investment(investment_id, session=session)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    pitch = await pitch_repo.get_startup_pitch(item["pitch_id"], founder_id=founder_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if item["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending investor requests can be updated")
    updated = await investment_repo.update_investment_status(investment_id, status_value, session=session)
    await notification_repo.create_notification(
        user_id=item["investor_id"],
        type="investment",
        title="Founder responded to your interest",
        body=f"Your startup interest request is now {status_value.replace('_', ' ')}.",
        link="/investor/dashboard",
        session=session,
    )
    return updated
