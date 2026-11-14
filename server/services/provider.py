"""services/provider.py - Business logic for provider profiles."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import provider_profile as provider_repo
from repositories import user as user_repo

logger = logging.getLogger(__name__)


async def get_provider_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get provider profile for a user."""
    profile = await provider_repo.get_provider_profile_by_user_id(user_id, session=session)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found. Complete onboarding first.",
        )
    return profile


async def create_or_update_provider_profile(
    user_id: int,
    company_name: str | None = None,
    trading_name: str | None = None,
    provider_type: str | None = None,
    location: str | None = None,
    about: str | None = None,
    enclave_key: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create or update provider profile."""
    # Check if user exists and has provider role
    user = await user_repo.get_user_by_id(user_id, session=session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    existing = await provider_repo.get_provider_profile_by_user_id(user_id, session=session)
    if existing:
        return await provider_repo.update_provider_profile(
            user_id=user_id,
            company_name=company_name,
            trading_name=trading_name,
            provider_type=provider_type,
            location=location,
            about=about,
            enclave_key=enclave_key,
            session=session,
        )
    else:
        return await provider_repo.create_provider_profile(
            user_id=user_id,
            company_name=company_name,
            trading_name=trading_name,
            provider_type=provider_type,
            location=location,
            about=about,
            enclave_key=enclave_key,
            session=session,
        )