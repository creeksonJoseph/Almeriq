"""services/asset.py - Business logic for assets."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import asset as asset_repo
from repositories import provider_profile as provider_repo

logger = logging.getLogger(__name__)


async def create_asset(
    provider_id: int,
    name: str,
    category: str,
    kind: str,
    description: str | None = None,
    specs: dict | None = None,
    price_monthly: float | None = None,
    quantity_capacity: int | None = None,
    status: str = "available",
    telemetry_url: str | None = None,
    client_asset_id: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new asset for a provider."""
    # Verify provider exists
    provider = await provider_repo.get_provider_profile_by_id(provider_id, session=session)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )

    if client_asset_id:
        existing = await asset_repo.get_asset_by_client_id(provider_id, client_asset_id, session=session)
        if existing:
            # update latest data
            if existing.get("id"):
                return await asset_repo.update_asset(
                    asset_id=existing["id"],
                    provider_id=provider_id,
                    name=name,
                    category=category,
                    kind=kind,
                    description=description,
                    specs=specs,
                    price_monthly=price_monthly,
                    quantity_capacity=quantity_capacity,
                    status=status,
                    telemetry_url=telemetry_url,
                    session=session,
                )
            return existing

    try:
        if session is not None:
            async with session.begin_nested():
                return await asset_repo.create_asset(
                    provider_id=provider_id,
                    name=name,
                    category=category,
                    kind=kind,
                    description=description,
                    specs=specs,
                    price_monthly=price_monthly,
                    quantity_capacity=quantity_capacity,
                    status=status,
                    telemetry_url=telemetry_url,
                    client_asset_id=client_asset_id,
                    session=session,
                )
        else:
            return await asset_repo.create_asset(
                provider_id=provider_id,
                name=name,
                category=category,
                kind=kind,
                description=description,
                specs=specs,
                price_monthly=price_monthly,
                quantity_capacity=quantity_capacity,
                status=status,
                telemetry_url=telemetry_url,
                client_asset_id=client_asset_id,
                session=None,
            )
    except Exception as exc:
        if client_asset_id:
            existing = await asset_repo.get_asset_by_client_id(provider_id, client_asset_id, session=session)
            if existing:
                return await asset_repo.update_asset(
                    asset_id=existing["id"],
                    provider_id=provider_id,
                    name=name,
                    category=category,
                    kind=kind,
                    description=description,
                    specs=specs,
                    price_monthly=price_monthly,
                    quantity_capacity=quantity_capacity,
                    status=status,
                    telemetry_url=telemetry_url,
                    session=session,
                )
        raise exc


async def get_asset(
    asset_id: int,
    provider_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get asset by ID (ownership check)."""
    asset = await asset_repo.get_asset_by_id(asset_id, provider_id, session=session)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    return asset


async def list_assets(
    provider_id: int,
    status: str | None = None,
    kind: str | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List assets for a provider."""
    return await asset_repo.list_assets(
        provider_id=provider_id,
        status=status,
        kind=kind,
        limit=limit,
        offset=offset,
        session=session,
    )


async def update_asset(
    asset_id: int,
    provider_id: int,
    name: str | None = None,
    category: str | None = None,
    kind: str | None = None,
    description: str | None = None,
    specs: dict | None = None,
    price_monthly: float | None = None,
    quantity_capacity: int | None = None,
    status: str | None = None,
    telemetry_url: str | None = None,
    is_active: bool | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Update asset (ownership check)."""
    asset = await asset_repo.update_asset(
        asset_id=asset_id,
        provider_id=provider_id,
        name=name,
        category=category,
        kind=kind,
        description=description,
        specs=specs,
        price_monthly=price_monthly,
        quantity_capacity=quantity_capacity,
        status=status,
        telemetry_url=telemetry_url,
        is_active=is_active,
        session=session,
    )
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )
    return asset


async def delete_asset(
    asset_id: int,
    provider_id: int,
    session: AsyncSession | None = None,
) -> None:
    """Delete asset (ownership check)."""
    deleted = await asset_repo.delete_asset(asset_id, provider_id, session=session)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )


async def list_public_assets(
    category: str | None = None,
    kind: str | None = None,
    location: str | None = None,
    availability: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """List public assets for marketplace (joins with provider profiles)."""
    from sqlalchemy import select, func, and_, or_
    from sqlalchemy.ext.asyncio import AsyncSession
    from core.db import async_session_factory
    from models.asset import Asset
    from models.provider_profile import ProviderProfile

    async def _query(session: AsyncSession):
        stmt = (
            select(Asset, ProviderProfile)
            .join(ProviderProfile, Asset.provider_id == ProviderProfile.id)
            .where(Asset.is_active == True, ProviderProfile.verified == True)
        )
        count_stmt = (
            select(func.count())
            .select_from(Asset)
            .join(ProviderProfile, Asset.provider_id == ProviderProfile.id)
            .where(Asset.is_active == True, ProviderProfile.verified == True)
        )

        if category:
            stmt = stmt.where(Asset.category == category)
            count_stmt = count_stmt.where(Asset.category == category)
        if kind:
            stmt = stmt.where(Asset.kind == kind)
            count_stmt = count_stmt.where(Asset.kind == kind)
        if availability:
            stmt = stmt.where(Asset.status == availability)
            count_stmt = count_stmt.where(Asset.status == availability)
        if min_price is not None:
            stmt = stmt.where(Asset.price_monthly >= min_price)
            count_stmt = count_stmt.where(Asset.price_monthly >= min_price)
        if max_price is not None:
            stmt = stmt.where(Asset.price_monthly <= max_price)
            count_stmt = count_stmt.where(Asset.price_monthly <= max_price)
        if location:
            stmt = stmt.where(ProviderProfile.location.ilike(f"%{location}%"))
            count_stmt = count_stmt.where(ProviderProfile.location.ilike(f"%{location}%"))
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Asset.name.ilike(search_term),
                    Asset.description.ilike(search_term),
                    Asset.category.ilike(search_term),
                )
            )
            count_stmt = count_stmt.where(
                or_(
                    Asset.name.ilike(search_term),
                    Asset.description.ilike(search_term),
                    Asset.category.ilike(search_term),
                )
            )

        stmt = stmt.order_by(Asset.created_at.desc()).limit(limit).offset(offset)

        result = await session.execute(stmt)
        count = await session.scalar(count_stmt)

        items = []
        for asset, provider in result.all():
            asset_dict = asset.to_dict()
            asset_dict["provider_name"] = provider.company_name or provider.trading_name or "Unknown"
            asset_dict["provider_verified"] = provider.verified
            asset_dict["provider_location"] = provider.location
            asset_dict["provider_enclave_key"] = provider.enclave_key
            items.append(asset_dict)

        return items, count or 0

    async with async_session_factory() as s:
        return await _query(s)


async def get_public_asset_detail(
    asset_id: int,
) -> dict | None:
    """Get public asset detail with provider info."""
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from core.db import async_session_factory
    from models.asset import Asset
    from models.provider_profile import ProviderProfile

    async with async_session_factory() as s:
        stmt = (
            select(Asset, ProviderProfile)
            .join(ProviderProfile, Asset.provider_id == ProviderProfile.id)
            .where(Asset.id == asset_id, Asset.is_active == True)
        )
        result = await s.execute(stmt)
        row = result.first()
        if not row:
            return None
        asset, provider = row
        asset_dict = asset.to_dict()
        asset_dict["provider_name"] = provider.company_name or provider.trading_name or "Unknown"
        asset_dict["provider_verified"] = provider.verified
        asset_dict["provider_location"] = provider.location
        asset_dict["provider_enclave_key"] = provider.enclave_key
        asset_dict["provider_about"] = provider.about
        return asset_dict


async def search_assets(
    q: str | None = None,
    category: str | None = None,
    location: str | None = None,
    kind: str | None = None,
    availability: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[dict], int]:
    """Search assets for public search page."""
    return await list_public_assets(
        category=category,
        kind=kind,
        location=location,
        availability=availability,
        min_price=min_price,
        max_price=max_price,
        search=q,
        limit=limit,
        offset=offset,
    )