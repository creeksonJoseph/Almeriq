"""repositories/asset.py - SQLAlchemy 2.0 repository for Asset model."""
from __future__ import annotations
import logging
from typing import Optional
from sqlalchemy import select, update, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.asset import Asset

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
    is_active: bool = True,
    client_asset_id: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a new asset."""
    logger.info(f"[REPO-CREATE-ASSET] Starting for provider_id: {provider_id}")
    asset = Asset(
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
        client_asset_id=client_asset_id,
    )

    if session is not None:
        session.add(asset)
        await session.flush()
        return asset.to_dict()

    async with async_session_factory() as s:
        s.add(asset)
        await s.commit()
        await s.refresh(asset)
        return asset.to_dict()


async def get_asset_by_client_id(
    provider_id: int,
    client_asset_id: str,
    session: AsyncSession | None = None,
) -> dict | None:
    stmt = select(Asset).where(
        Asset.provider_id == provider_id,
        Asset.client_asset_id == client_asset_id,
    ).limit(1)
    if session is not None:
        asset = await session.scalar(stmt)
        return asset.to_dict() if asset else None
    async with async_session_factory() as s:
        asset = await s.scalar(stmt)
        return asset.to_dict() if asset else None


async def get_asset_by_id(
    asset_id: int,
    provider_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch asset by id, optionally scoped to provider."""
    stmt = select(Asset).where(Asset.id == asset_id)
    if provider_id is not None:
        stmt = stmt.where(Asset.provider_id == provider_id)
    stmt = stmt.limit(1)

    if session is not None:
        asset = await session.scalar(stmt)
        return asset.to_dict() if asset else None

    async with async_session_factory() as s:
        asset = await s.scalar(stmt)
        return asset.to_dict() if asset else None


async def list_assets(
    provider_id: int,
    status: str | None = None,
    kind: str | None = None,
    is_active: bool | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    """List assets for a provider with optional filters."""
    stmt = select(Asset).where(Asset.provider_id == provider_id)
    count_stmt = select(func.count()).select_from(Asset).where(Asset.provider_id == provider_id)

    if status is not None:
        stmt = stmt.where(Asset.status == status)
        count_stmt = count_stmt.where(Asset.status == status)
    if kind is not None:
        stmt = stmt.where(Asset.kind == kind)
        count_stmt = count_stmt.where(Asset.kind == kind)
    if is_active is not None:
        stmt = stmt.where(Asset.is_active == is_active)
        count_stmt = count_stmt.where(Asset.is_active == is_active)

    stmt = stmt.order_by(Asset.created_at.desc()).limit(limit).offset(offset)

    if session is not None:
        result = await session.execute(stmt)
        assets = result.scalars().all()
        count = await session.scalar(count_stmt)
        return [a.to_dict() for a in assets], count or 0

    async with async_session_factory() as s:
        result = await s.execute(stmt)
        assets = result.scalars().all()
        count = await s.scalar(count_stmt)
        return [a.to_dict() for a in assets], count or 0


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
    media: list[dict] | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update asset (ownership check via provider_id)."""
    values: dict = {}
    if name is not None:
        values["name"] = name
    if category is not None:
        values["category"] = category
    if kind is not None:
        values["kind"] = kind
    if description is not None:
        values["description"] = description
    if specs is not None:
        values["specs"] = specs
    if price_monthly is not None:
        values["price_monthly"] = price_monthly
    if quantity_capacity is not None:
        values["quantity_capacity"] = quantity_capacity
    if status is not None:
        values["status"] = status
    if telemetry_url is not None:
        values["telemetry_url"] = telemetry_url
    if is_active is not None:
        values["is_active"] = is_active
    if media is not None:
        values["media"] = media

    if not values:
        return await get_asset_by_id(asset_id, provider_id, session)

    stmt = (
        update(Asset)
        .where(Asset.id == asset_id, Asset.provider_id == provider_id)
        .values(**values)
        .returning(Asset)
    )

    if session is not None:
        res = await session.execute(stmt)
        asset = res.scalar_one_or_none()
        return asset.to_dict() if asset else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        asset = res.scalar_one_or_none()
        return asset.to_dict() if asset else None


async def delete_asset(
    asset_id: int,
    provider_id: int,
    session: AsyncSession | None = None,
) -> bool:
    """Delete asset (ownership check via provider_id)."""
    stmt = delete(Asset).where(Asset.id == asset_id, Asset.provider_id == provider_id)

    if session is not None:
        res = await session.execute(stmt)
        return res.rowcount > 0

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        return res.rowcount > 0