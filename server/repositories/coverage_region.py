"""repositories/coverage_region.py - SQLAlchemy 2.0 repository for CoverageRegion model."""
from __future__ import annotations
import logging
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.coverage_region import CoverageRegion

logger = logging.getLogger(__name__)


async def create_coverage_region(
    provider_id: int,
    region: str,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new coverage region."""
    logger.info(f"[REPO-CREATE-COVERAGE] Starting for provider_id: {provider_id}, region: {region}")
    coverage = CoverageRegion(provider_id=provider_id, region=region)

    if session is not None:
        session.add(coverage)
        await session.flush()
        return coverage.to_dict()

    async with async_session_factory() as s:
        s.add(coverage)
        await s.commit()
        await s.refresh(coverage)
        return coverage.to_dict()


async def list_coverage_regions(
    provider_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all coverage regions for a provider."""
    stmt = select(CoverageRegion).where(CoverageRegion.provider_id == provider_id).order_by(CoverageRegion.region)

    if session is not None:
        result = await session.execute(stmt)
        regions = result.scalars().all()
        return [r.to_dict() for r in regions]

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        regions = result.scalars().all()
        return [r.to_dict() for r in regions]


async def delete_coverage_region(
    provider_id: int,
    region: str,
    session: AsyncSession | None = None,
) -> bool:
    """Delete a coverage region for a provider."""
    stmt = delete(CoverageRegion).where(
        CoverageRegion.provider_id == provider_id,
        CoverageRegion.region == region,
    )

    if session is not None:
        res = await session.execute(stmt)
        return res.rowcount > 0

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        return res.rowcount > 0


async def bulk_replace_coverage_regions(
    provider_id: int,
    regions: list[str],
    session: AsyncSession | None = None,
) -> list[dict]:
    """Replace all coverage regions for a provider with a new list."""
    if session is not None:
        # Delete existing
        await session.execute(
            delete(CoverageRegion).where(CoverageRegion.provider_id == provider_id)
        )
        # Insert new
        created = []
        for region in regions:
            coverage = CoverageRegion(provider_id=provider_id, region=region)
            session.add(coverage)
        await session.flush()
        # Re-fetch all
        result = await session.execute(
            select(CoverageRegion).where(CoverageRegion.provider_id == provider_id)
        )
        return [r.to_dict() for r in result.scalars().all()]

    async with async_session_factory() as s:
        await s.execute(
            delete(CoverageRegion).where(CoverageRegion.provider_id == provider_id)
        )
        for region in regions:
            coverage = CoverageRegion(provider_id=provider_id, region=region)
            s.add(coverage)
        await s.commit()
        result = await s.execute(
            select(CoverageRegion).where(CoverageRegion.provider_id == provider_id)
        )
        return [r.to_dict() for r in result.scalars().all()]