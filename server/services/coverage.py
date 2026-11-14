"""services/coverage.py - Business logic for coverage regions."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import coverage_region as coverage_repo
from repositories import provider_profile as provider_repo

logger = logging.getLogger(__name__)


VALID_REGIONS = {
    "africa", "asia_pacific", "europe", "latin_america",
    "middle_east", "north_america", "global"
}


async def list_coverage_regions(
    provider_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List coverage regions for a provider."""
    provider = await provider_repo.get_provider_profile_by_id(provider_id, session=session)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )
    return await coverage_repo.list_coverage_regions(provider_id, session=session)


async def add_coverage_region(
    provider_id: int,
    region: str,
    session: AsyncSession | None = None,
) -> dict:
    """Add a coverage region for a provider."""
    if region not in VALID_REGIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid region. Must be one of: {', '.join(sorted(VALID_REGIONS))}",
        )

    provider = await provider_repo.get_provider_profile_by_id(provider_id, session=session)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )

    return await coverage_repo.create_coverage_region(provider_id, region, session=session)


async def remove_coverage_region(
    provider_id: int,
    region: str,
) -> None:
    """Remove a coverage region for a provider."""
    provider = await provider_repo.get_provider_profile_by_id(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )

    deleted = await coverage_repo.delete_coverage_region(provider_id, region)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coverage region not found",
        )


async def replace_coverage_regions(
    provider_id: int,
    regions: list[str],
) -> list[dict]:
    """Replace all coverage regions for a provider."""
    for region in regions:
        if region not in VALID_REGIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid region: {region}. Must be one of: {', '.join(sorted(VALID_REGIONS))}",
            )

    provider = await provider_repo.get_provider_profile_by_id(provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )

    return await coverage_repo.bulk_replace_coverage_regions(provider_id, regions)