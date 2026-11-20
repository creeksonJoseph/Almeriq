"""Regression tests for atomic marketplace order and deal creation."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest
from fastapi import HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from api.routers import marketplace as marketplace_router
from api.routers import order as order_router
from models.base import Base
from models.order import Order
from models.order_event import OrderEvent
from models.notification import Notification
from repositories.user import create_user
from schemas.provider import MarketplaceCheckoutRequest, OrderStatusUpdateRequest, WaybillUploadRequest
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


@pytest.mark.asyncio
async def test_provider_can_confirm_and_dispatch_order_with_audited_events(session, monkeypatch):
    buyer, provider, asset = await _checkout_fixture(session)

    async def get_listing(asset_id: int):
        return {
            "id": asset["id"],
            "provider_id": provider["id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)
    checkout = await marketplace_router.create_marketplace_checkout(
        body=MarketplaceCheckoutRequest(asset_id=asset["id"]),
        response=Response(),
        current_user={"id": buyer["id"]},
        db=session,
    )
    order_id = checkout["order"]["id"]

    confirmed = await order_router.update_order_status(
        response=Response(),
        order_id=order_id,
        body=OrderStatusUpdateRequest(status="confirmed"),
        profile=provider,
        db=session,
    )
    assert confirmed["status"] == "confirmed"

    dispatched = await order_router.dispatch_order(
        response=Response(),
        order_id=order_id,
        body=WaybillUploadRequest(
            waybill_url="https://example.com/waybills/test-order",
            tracking_number="TRACK-123",
        ),
        profile=provider,
        db=session,
    )
    assert dispatched["status"] == "shipped"
    await session.commit()

    events = list((await session.scalars(
        select(OrderEvent).where(OrderEvent.order_id == order_id).order_by(OrderEvent.id)
    )).all())
    assert [event.event_type for event in events] == [
        "created",
        "status_changed",
        "waybill_uploaded",
        "status_changed",
    ]
    assert events[1].actor_id == provider["user_id"]
    assert events[2].actor_id == provider["user_id"]
    assert events[3].actor_id == provider["user_id"]

    buyer_notifications = list((await session.scalars(
        select(Notification).where(Notification.user_id == buyer["id"])
    )).all())
    assert any("confirmed" in item.body for item in buyer_notifications)
    assert any("shipped" in item.body for item in buyer_notifications)


@pytest.mark.asyncio
async def test_provider_cannot_skip_or_reverse_order_statuses(session, monkeypatch):
    buyer, provider, asset = await _checkout_fixture(session)

    async def get_listing(asset_id: int):
        return {
            "id": asset["id"],
            "provider_id": provider["id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)
    checkout = await marketplace_router.create_marketplace_checkout(
        body=MarketplaceCheckoutRequest(asset_id=asset["id"]),
        response=Response(),
        current_user={"id": buyer["id"]},
        db=session,
    )
    order_id = checkout["order"]["id"]
    await session.commit()

    with pytest.raises(HTTPException) as error:
        await order_router.update_order_status(
            response=Response(),
            order_id=order_id,
            body=OrderStatusUpdateRequest(status="completed"),
            profile=provider,
            db=session,
        )
    assert error.value.status_code == 409
    await session.rollback()
    order = await session.scalar(select(Order).where(Order.id == order_id))
    assert order.status == "pending_review"
