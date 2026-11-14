"""api/routers/coverage.py - Provider coverage region endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_provider_profile
from schemas.provider import CoverageRegionCreateRequest, CoverageRegionListResponse, CoverageRegionResponse, CoverageRegionUpdateRequest
from services import coverage as svc

router = APIRouter(prefix="/api", tags=["coverage"])


@router.get("/provider/coverage-regions", response_model=CoverageRegionListResponse)
async def list_coverage_regions(
    response: Response,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List coverage regions for the current provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    items = await svc.list_coverage_regions(provider_id=profile["id"], session=db)
    return {"items": items}


@router.post(
    "/provider/coverage-regions",
    status_code=status.HTTP_201_CREATED,
    response_model=CoverageRegionResponse,
)
async def add_coverage_region(
    response: Response,
    body: CoverageRegionCreateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Add a coverage region for the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.add_coverage_region(
        provider_id=profile["id"],
        region=body.region,
        session=db,
    )


@router.put("/provider/coverage-regions", response_model=CoverageRegionListResponse)
async def replace_coverage_regions(
    response: Response,
    body: CoverageRegionUpdateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    valid = [CoverageRegionCreateRequest(region=region).region for region in body.regions]
    refreshed = await svc.replace_coverage_regions(provider_id=profile["id"], regions=valid)
    response.headers["Cache-Control"] = "no-store"
    return {"items": [item for item in refreshed if item["region"] in valid]}
