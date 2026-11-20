"""Regression tests for buyer/provider deal participant authorization."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
from repositories.user import create_user
from repositories import order as order_repo
from services.asset import create_asset
from services.deal import create_deal, get_deal, sign_deal
from services.provider import create_or_update_provider_profile


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'deals.db'}",
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


async def _provider(session: AsyncSession, company_name: str = "Listing Provider") -> tuple[dict, dict]:
    user = await _user(session, role="INFRASTRUCTURE_PROVIDER")
    profile = await create_or_update_provider_profile(
        user["id"],
        company_name=company_name,
        location="Nairobi",
        session=session,
    )
    return user, profile


async def _order_for_buyer(session: AsyncSession, buyer_id: int, provider_id: int) -> dict:
    asset = await create_asset(
        provider_id,
        name="Test listing",
        category="Compute",
        kind="digital",
        price_monthly=125.0,
        session=session,
    )
    return await order_repo.create_order(
        order_id=uuid.uuid4().hex,
        client_id=buyer_id,
        provider_id=provider_id,
        asset_id=asset["id"],
        allocation="Regression test order",
        lease_amount=125.0,
        session=session,
    )


@pytest.mark.asyncio
async def test_buyer_without_provider_profile_can_create_and_sign_deal(session):
    _, listing_provider = await _provider(session)
    buyer = await _user(session)
    order = await _order_for_buyer(session, buyer["id"], listing_provider["id"])
    await session.commit()

    deal = await create_deal(
        order_id=order["id"],
        payment_method="mpesa",
        amount=125.0,
        client_id=buyer["id"],
        session=session,
    )
    await session.commit()

    signed = await sign_deal(
        deal_id=deal["id"],
        signature="data:image/png;base64,test",
        client_id=buyer["id"],
        session=session,
    )
    await session.commit()

    assert signed["payment_status"] == "simulated"
    assert signed["signature"] == "data:image/png;base64,test"


@pytest.mark.asyncio
async def test_buyer_with_own_provider_profile_is_still_authorized_as_buyer(session):
    _, listing_provider = await _provider(session)
    buyer, buyer_provider_profile = await _provider(session, company_name="Buyer Provider Co")
    order = await _order_for_buyer(session, buyer["id"], listing_provider["id"])
    await session.commit()

    deal = await create_deal(
        order_id=order["id"],
        payment_method="visa",
        amount=125.0,
        client_id=buyer["id"],
        session=session,
    )
    await session.commit()

    # The buyer's own provider profile must not be confused with the provider
    # who owns this order. Both participant checks are attempted independently.
    loaded = await get_deal(
        deal_id=deal["id"],
        provider_id=buyer_provider_profile["id"],
        client_id=buyer["id"],
        session=session,
    )
    signed = await sign_deal(
        deal_id=deal["id"],
        signature="data:image/png;base64,buyer-signature",
        provider_id=buyer_provider_profile["id"],
        client_id=buyer["id"],
        session=session,
    )
    await session.commit()

    assert loaded["provider_name"] == "Listing Provider"
    assert signed["signature"] == "data:image/png;base64,buyer-signature"
