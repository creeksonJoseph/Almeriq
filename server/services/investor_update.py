from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import investor_update as update_repo
from repositories import investment as investment_repo
from repositories import startup_pitch as pitch_repo
from repositories import notification as notification_repo


CONNECTED_STATUSES = {"accepted", "in_discussion", "invested"}


async def create_founder_update(founder_id: int, pitch_id: int, period: str, content: str, session: AsyncSession | None = None) -> dict:
    pitch = await pitch_repo.get_startup_pitch(pitch_id, founder_id=founder_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    clean_period = period.strip()
    clean_content = content.strip()
    if not clean_period or not clean_content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Update period and content are required")
    return await update_repo.create_investor_update(founder_id, pitch_id, clean_period, clean_content, session=session)


async def list_founder_updates(founder_id: int, pitch_id: int | None = None, session: AsyncSession | None = None) -> list[dict]:
    if pitch_id is not None:
        pitch = await pitch_repo.get_startup_pitch(pitch_id, founder_id=founder_id, session=session)
        if not pitch:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    return await update_repo.list_founder_investor_updates(founder_id, pitch_id=pitch_id, session=session)


async def publish_founder_update(update_id: int, founder_id: int, session: AsyncSession | None = None) -> dict:
    item = await update_repo.get_investor_update(update_id, founder_id=founder_id, session=session)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor update not found")
    if item["status"] == "published":
        return item
    pitch = await pitch_repo.get_startup_pitch(item["pitch_id"], founder_id=founder_id, session=session)
    if not pitch or pitch.get("status") != "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Publish the startup pitch before sharing investor updates")
    requests = await investment_repo.list_investments(founder_id=founder_id, session=session)
    investor_ids = sorted({
        request["investor_id"] for request in requests
        if request["pitch_id"] == item["pitch_id"] and request["status"] in CONNECTED_STATUSES
    })
    if not investor_ids:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This pitch has no accepted or active investor relationships to share the update with yet")
    published = await update_repo.publish_investor_update(update_id, founder_id, session=session)
    if not published:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor update not found")
    for investor_id in investor_ids:
        await notification_repo.create_notification(
            user_id=investor_id,
            type="investment",
            title=f"New update from {pitch['title']}",
            body=f"The founder shared an investor update for {item['period']}.",
            link="/investor/updates",
            session=session,
        )
    return published


async def list_investor_updates(investor_id: int, session: AsyncSession | None = None) -> list[dict]:
    requests = await investment_repo.list_investments(investor_id=investor_id, session=session)
    pitch_ids = sorted({
        item["pitch_id"] for item in requests if item["status"] in CONNECTED_STATUSES
    })
    updates = await update_repo.list_published_investor_updates(pitch_ids, session=session)
    for item in updates:
        item["pitch"] = await pitch_repo.get_startup_pitch(item["pitch_id"], session=session)
    return updates
