"""api/routers/provider.py - Provider profile endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user, get_current_provider_user, get_current_provider_profile
from schemas.provider import ProviderProfileResponse, ProviderProfileUpdateRequest
from services import provider as svc

router = APIRouter(prefix="/api", tags=["provider"])


@router.get("/provider/profile", response_model=ProviderProfileResponse)
async def get_provider_profile(
    response: Response,
    current_user: dict = Depends(get_current_user),
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve the current provider's profile."""
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_provider_profile(user_id=current_user["id"], session=db)


@router.put("/provider/profile", response_model=ProviderProfileResponse)
async def update_provider_profile(
    response: Response,
    body: ProviderProfileUpdateRequest,
    current_user: dict = Depends(get_current_provider_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create or update the current provider's profile."""
    response.headers["Cache-Control"] = "no-store"
    data = body.model_dump(exclude_unset=True)
    return await svc.create_or_update_provider_profile(
        user_id=current_user["id"],
        session=db,
        **data,
    )
