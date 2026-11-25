from __future__ import annotations
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import expert_profile as profile_repo
from repositories import advisory_request as request_repo
from repositories import notification as notification_repo
from repositories import user as user_repo


async def upsert_profile(user_id: int, session: AsyncSession | None = None, **values) -> dict:
    years = values.get("years_experience")
    rate = values.get("hourly_rate")
    if years is not None and years < 0:
        raise HTTPException(status_code=422, detail="Years of experience cannot be negative")
    if rate is not None and rate < 0:
        raise HTTPException(status_code=422, detail="Hourly rate cannot be negative")
    return await profile_repo.upsert_expert_profile(user_id, session=session, **values)


async def get_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    profile = await profile_repo.get_expert_profile(user_id, session=session)
    if not profile:
        raise HTTPException(status_code=404, detail="Expert profile not found")
    return profile


async def list_profiles(limit: int = 50, offset: int = 0, session: AsyncSession | None = None) -> list[dict]:
    return await profile_repo.list_expert_profiles(limit=limit, offset=offset, session=session)


async def create_request(founder_id: int, expert_id: int, subject: str, description: str, budget: float | None = None, session: AsyncSession | None = None) -> dict:
    if founder_id == expert_id:
        raise HTTPException(status_code=400, detail="You cannot request your own advisory services")
    profile = await profile_repo.get_expert_profile(expert_id, session=session)
    if not profile or not profile.get("is_active"):
        raise HTTPException(status_code=404, detail="Expert profile not found")
    if budget is not None and budget < 0:
        raise HTTPException(status_code=422, detail="Budget cannot be negative")
    if len(subject.strip()) < 3 or len(description.strip()) < 10:
        raise HTTPException(status_code=422, detail="Add a clear subject and at least 10 characters of request details")
    request = await request_repo.create_advisory_request(founder_id, expert_id, subject.strip(), description.strip(), budget, session=session)
    await notification_repo.create_notification(
        user_id=expert_id,
        type="advisory",
        title="New advisory request",
        body=f"A founder has requested help with: {subject.strip()}",
        link="/dashboard",
        session=session,
    )
    return request


async def list_requests(user_id: int, role: str, session: AsyncSession | None = None) -> list[dict]:
    items = await request_repo.list_advisory_requests(user_id, role, session=session)
    if role == "expert":
        names = await user_repo.get_user_names_by_ids(
            [item["founder_id"] for item in items],
            session=session,
        )
        for item in items:
            item["founder_name"] = names.get(item["founder_id"]) or f"Founder #{item['founder_id']}"
    else:
        headlines = await profile_repo.get_expert_headlines_by_user_ids(
            [item["expert_id"] for item in items],
            session=session,
        )
        for item in items:
            item["expert_headline"] = headlines.get(item["expert_id"]) or f"Expert #{item['expert_id']}"
    return items


async def update_request(request_id: int, expert_id: int, status_value: str, session: AsyncSession | None = None) -> dict:
    if status_value not in {"accepted", "declined", "completed"}:
        raise HTTPException(status_code=422, detail="Status must be accepted, declined, or completed")
    item = await request_repo.get_advisory_request(request_id, session=session)
    if not item or item["expert_id"] != expert_id:
        raise HTTPException(status_code=404, detail="Advisory request not found")
    if item["status"] in {"declined", "completed"}:
        raise HTTPException(status_code=409, detail="This advisory request is already closed")
    if status_value in {"accepted", "declined"} and item["status"] != "pending":
        raise HTTPException(status_code=409, detail="Only pending requests can be accepted or declined")
    if status_value == "completed" and item["status"] != "accepted":
        raise HTTPException(status_code=409, detail="Only accepted engagements can be completed")
    updated = await request_repo.update_advisory_request_status(request_id, status_value, session=session)
    await notification_repo.create_notification(
        user_id=item["founder_id"],
        type="advisory",
        title="Expert responded to your request",
        body=f"Your advisory request is now {status_value}.",
        link="/founder/experts",
        session=session,
    )
    return updated
