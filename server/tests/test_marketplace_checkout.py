"""Regression tests for atomic marketplace order and deal creation."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest
from fastapi import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from api.routers import marketplace as marketplace_router
from models.base import Base
from models.order import Order
from repositories.user import create_user
from schemas.provider import MarketplaceCheckoutRequest
from services.asset import create_asset
from services.provider import create_or_update_provider_profile


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'marketplace-checkout.db'}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


async def _user(session: AsyncSession, role: str = "founder") -> dict:
    return await create_user(
        email=f"{uuid.uuid4().hex}@example.com",
        hashed_password="test-password",
        role=role,
        session=session,
    )


async def _checkout_fixture(session: AsyncSession) -> tuple[dict, dict, dict]:
    provider_user = await _user(session, role="INFRASTRUCTURE_PROVIDER")
    provider = await create_or_update_provider_profile(
        provider_user["id"],
        company_name="Checkout Test Provider",
        location="Nairobi",
        session=session,
    )
    buyer = await _user(session)
    asset = await create_asset(
        provider["id"],
        name="Checkout Test Listing",
        category="Compute",
        kind="digital",
        price_monthly=250.0,
        session=session,
    )
    await session.commit()
    return buyer, provider, asset


@pytest.mark.asyncio
async def test_marketplace_checkout_creates_order_and_deal_together(session, monkeypatch):
    buyer, provider, asset = await _checkout_fixture(session)

    async def get_listing(asset_id: int):
        assert asset_id == asset["id"]
        return {
            "id": asset["id"],
            "provider_id": provider["id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)

    result = await marketplace_router.create_marketplace_checkout(
        body=MarketplaceCheckoutRequest(asset_id=asset["id"], payment_method="mpesa"),
        response=Response(),
        current_user={"id": buyer["id"]},
        db=session,
    )
    await session.commit()

    order = await session.scalar(select(Order).where(Order.id == result["order"]["id"]))
    assert order is not None
    assert order.client_id == buyer["id"]
    assert order.provider_id == provider["id"]
    assert order.lease_amount == 250.0
    assert result["deal"]["order_id"] == order.id
    assert result["deal"]["amount"] == 250.0
    assert result["deal"]["payment_method"] == "mpesa"


@pytest.mark.asyncio
async def test_marketplace_checkout_rolls_back_order_when_deal_creation_fails(session, monkeypatch):
    buyer, provider, asset = await _checkout_fixture(session)

    async def get_listing(asset_id: int):
        return {
            "id": asset["id"],
            "provider_id": provider["id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    async def fail_deal_creation(**kwargs):
        raise RuntimeError("simulated deal persistence failure")

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)
    monkeypatch.setattr(marketplace_router.deal_service, "create_deal", fail_deal_creation)

    with pytest.raises(RuntimeError, match="simulated deal persistence failure"):
        await marketplace_router.create_marketplace_checkout(
            body=MarketplaceCheckoutRequest(asset_id=asset["id"]),
            response=Response(),
            current_user={"id": buyer["id"]},
            db=session,
        )

    await session.rollback()
    remaining_order = await session.scalar(select(Order).where(Order.client_id == buyer["id"]))
    assert remaining_order is None
