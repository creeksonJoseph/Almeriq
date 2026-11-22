"""Regression tests for atomic marketplace order and deal creation."""
from __future__ import annotations

import uuid
from typing import AsyncGenerator

import pytest
from fastapi import FastAPI, HTTPException, Request, Response, status
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from api.dependencies import get_current_user, get_db
from api.errors import catch_all_handler, http_exception_handler
from api.routers import deal as deal_router
from api.routers import marketplace as marketplace_router
from api.routers import order as order_router
from api.routers.deal import router as deal_api_router
from api.routers.marketplace import router as marketplace_api_router
from api.routers.order import router as order_api_router
from models.base import Base
from models.deal import Deal
from models.order import Order
from models.order_event import OrderEvent
from models.notification import Notification
from repositories.user import create_user
from schemas.provider import (
    MarketplaceCheckoutRequest,
    OrderStatusUpdateRequest,
    WaybillUploadRequest,
)
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

    confirmed = await order_router.update_order_status(
        response=Response(),
        order_id=order_id,
        body=OrderStatusUpdateRequest(status="confirmed"),
        profile=provider,
        db=session,
    )
    assert confirmed["status"] == "confirmed"
    await session.commit()

    with pytest.raises(HTTPException) as shipping_error:
        await order_router.update_order_status(
            response=Response(),
            order_id=order_id,
            body=OrderStatusUpdateRequest(status="shipped"),
            profile=provider,
            db=session,
        )
    assert shipping_error.value.status_code == 409
    await session.rollback()
    order = await session.scalar(select(Order).where(Order.id == order_id))
    assert order.status == "confirmed"


# ── HTTP-level integration tests via the real FastAPI request lifecycle ─────

@pytest.fixture
async def http_client(tmp_path) -> AsyncGenerator[dict, None]:
    """Isolated FastAPI test client backed by a throwaway SQLite database.

    Overrides get_db (isolated test session, commit-on-success / rollback-on-exception)
    and get_current_user (test buyer) so no production data is ever touched.
    """
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'marketplace-checkout-http.db'}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    factory = async_sessionmaker(engine, expire_on_commit=False)

    # Seed test data directly in the isolated DB
    async with factory() as s:
        buyer = await create_user(
            email=f"{uuid.uuid4().hex}@example.com",
            hashed_password="x",
            role="user",
            session=s,
        )
        provider_user = await create_user(
            email=f"{uuid.uuid4().hex}@example.com",
            hashed_password="x",
            role="INFRASTRUCTURE_PROVIDER",
            session=s,
        )
        provider = await create_or_update_provider_profile(
            provider_user["id"],
            company_name="HTTP Test Provider",
            location="Nairobi",
            session=s,
        )
        asset = await create_asset(
            provider["id"],
            name="HTTP Test Listing",
            category="Compute",
            kind="digital",
            price_monthly=250.0,
            session=s,
        )
        await s.commit()
        buyer_id = buyer["id"]
        provider_id = provider["id"]
        asset_id = asset["id"]

    app = FastAPI()
    app.include_router(marketplace_api_router)
    app.include_router(order_api_router)
    app.include_router(deal_api_router)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, catch_all_handler)

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def override_get_current_user(request: Request) -> dict:
        return {"id": buyer_id, "email": buyer["email"], "role": buyer["role"]}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as ac:
        yield {
            "client": ac,
            "buyer_id": buyer_id,
            "provider_id": provider_id,
            "asset_id": asset_id,
            "factory": factory,
        }

    app.dependency_overrides.clear()
    await engine.dispose()


async def _checkout_payload(asset_id: int) -> dict:
    return {"asset_id": asset_id, "payment_method": "mpesa"}


@pytest.mark.asyncio
async def test_http_checkout_creates_one_order_and_one_deal(http_client, monkeypatch):
    """Successful checkout persists exactly one order + one deal using the
    listing's authoritative price (not a client-submitted amount)."""
    client = http_client["client"]
    buyer_id = http_client["buyer_id"]
    provider_id = http_client["provider_id"]
    asset_id = http_client["asset_id"]
    factory = http_client["factory"]

    async def get_listing(_asset_id: int):
        assert _asset_id == asset_id
        return {
            "id": asset_id,
            "provider_id": provider_id,
            "status": "available",
            "price_monthly": 250.0,
        }

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)

    resp = await client.post(
        "/api/marketplace/checkout",
        json=await _checkout_payload(asset_id),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert "order" in body and "deal" in body
    order_id = body["order"]["id"]

    # Verify against the isolated DB (a fresh session, post-commit)
    async with factory() as s:
        order = await s.scalar(select(Order).where(Order.id == order_id))
        assert order is not None
        assert order.client_id == buyer_id
        assert order.provider_id == provider_id
        assert order.lease_amount == 250.0  # listing's authoritative price

        deal_count = await s.scalar(
            select(func.count()).select_from(Deal).where(Deal.order_id == order_id)
        )
        assert deal_count == 1
        deal = await s.scalar(select(Deal).where(Deal.order_id == order_id))
        assert deal.amount == 250.0  # deal mirrors the listing price
        assert deal.payment_method == "mpesa"


@pytest.mark.asyncio
async def test_http_checkout_rolls_back_both_order_and_deal(http_client, monkeypatch):
    """If deal creation fails after order creation, the HTTP request fails and
    neither record remains persisted (no orphaned order)."""
    client = http_client["client"]
    buyer_id = http_client["buyer_id"]
    asset_id = http_client["asset_id"]
    factory = http_client["factory"]

    async def get_listing(_asset_id: int):
        return {
            "id": asset_id,
            "provider_id": http_client["provider_id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    async def fail_deal_creation(**kwargs):
        raise RuntimeError("simulated deal persistence failure")

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)
    monkeypatch.setattr(marketplace_router.deal_service, "create_deal", fail_deal_creation)

    resp = None
    try:
        resp = await client.post(
            "/api/marketplace/checkout",
            json=await _checkout_payload(asset_id),
        )
    except RuntimeError:
        # The exception escapes the route (the app converts unexpected errors to
        # a 500 in production via catch_all_handler). Either way the request
        # fails, which is what we assert below.
        pass

    assert resp is None or resp.status_code != 200, "checkout should have failed"

    # Neither order nor deal may remain persisted (get_db rolled back the
    # failed request, so no orphaned order or deal is left behind).
    async with factory() as s:
        order_count = await s.scalar(
            select(func.count()).select_from(Order).where(Order.client_id == buyer_id)
        )
        assert order_count == 0, f"expected 0 orders, got {order_count}"
        deal_count = await s.scalar(select(func.count()).select_from(Deal))
        assert deal_count == 0, f"expected 0 deals, got {deal_count}"


@pytest.mark.asyncio
async def test_http_duplicate_deal_creation_rejected(http_client, monkeypatch):
    """Creating a second deal for the same order is rejected with 409 and leaves
    exactly one deal row."""
    client = http_client["client"]
    buyer_id = http_client["buyer_id"]
    asset_id = http_client["asset_id"]
    factory = http_client["factory"]

    async def get_listing(_asset_id: int):
        return {
            "id": asset_id,
            "provider_id": http_client["provider_id"],
            "status": "available",
            "price_monthly": 250.0,
        }

    monkeypatch.setattr(marketplace_router.svc, "get_marketplace_listing", get_listing)

    # First checkout creates order #1 + deal #1
    resp = await client.post("/api/marketplace/checkout", json=await _checkout_payload(asset_id))
    assert resp.status_code == 201, resp.text
    order_id = resp.json()["order"]["id"]

    # Second attempt to create a deal for the SAME order → 409 conflict
    resp = await client.post(
        "/api/deals",
        json={"order_id": order_id, "payment_method": "visa", "amount": 250.0},
    )
    assert resp.status_code == 409, resp.text

    # Exactly one deal remains for the order
    async with factory() as s:
        deal_count = await s.scalar(
            select(func.count()).select_from(Deal).where(Deal.order_id == order_id)
        )
        assert deal_count == 1, f"expected 1 deal, got {deal_count}"
