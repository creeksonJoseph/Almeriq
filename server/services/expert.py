from __future__ import annotations
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import expert_profile as profile_repo
from repositories import advisory_request as request_repo


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
    return await request_repo.create_advisory_request(founder_id, expert_id, subject.strip(), description.strip(), budget, session=session)


async def list_requests(user_id: int, role: str, session: AsyncSession | None = None) -> list[dict]:
    return await request_repo.list_advisory_requests(user_id, role, session=session)


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
    return await request_repo.update_advisory_request_status(request_id, status_value, session=session)
