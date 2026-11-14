"""api/routers/asset.py - Provider asset endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_provider_profile
from schemas.provider import AssetCreateRequest, AssetListResponse, AssetResponse, AssetUpdateRequest
from services import asset as svc

router = APIRouter(prefix="/api", tags=["assets"])


@router.get("/provider/assets", response_model=AssetListResponse)
async def list_assets(
    response: Response,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
    status: str | None = Query(default=None),
    kind: str | None = Query(default=None),
) -> dict:
    """List assets owned by the current provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items, total = await svc.list_assets(
        provider_id=profile["id"],
        status=status,
        kind=kind,
        session=db,
    )
    return {"items": items, "total": total}


@router.post("/provider/assets", status_code=status.HTTP_201_CREATED, response_model=AssetResponse)
async def create_asset(
    response: Response,
    body: AssetCreateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new asset for the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_asset(
        provider_id=profile["id"],
        session=db,
        **body.model_dump(),
    )


@router.get("/provider/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(
    response: Response,
    asset_id: int,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a single asset owned by the current provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_asset(asset_id=asset_id, provider_id=profile["id"], session=db)


@router.put("/provider/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    response: Response,
    asset_id: int,
    body: AssetUpdateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update an asset owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    data = body.model_dump(exclude_unset=True)
    return await svc.update_asset(
        asset_id=asset_id,
        provider_id=profile["id"],
        session=db,
        **data,
    )


@router.delete("/provider/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(
    response: Response,
    asset_id: int,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an asset owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    await svc.delete_asset(asset_id=asset_id, provider_id=profile["id"], session=db)
