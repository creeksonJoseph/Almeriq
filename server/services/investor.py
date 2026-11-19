from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import investor_profile as repo
logger = logging.getLogger(__name__)

async def get_investor_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    profile = await repo.get_investor_profile_by_user_id(user_id, session=session)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investor profile not found")
    return profile

async def create_investor_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    return await repo.create_investor_profile(user_id=user_id, session=session)
