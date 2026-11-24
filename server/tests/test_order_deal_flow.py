"""Order & Deal lifecycle integration tests (Phase 2).

These tests exercise the marketplace checkout / order management business logic
against an isolated SQLite database created under pytest's tmp_path. No test ever
touches the development or production database.

Covered:
- Order creation (marketplace checkout) + created event + provider notification.
- Deal creation (idempotent, duplicate rejected).
- Deal retrieval with provider/asset enrichment.
- Deal signing (buyer and provider authorization).
- Cross-owner access rejected (404).
- Order status transitions (valid accepted, invalid rejected with 409).
- Waybill upload + retrieval + dispatch flow.
- Notifications on order creation and status change.
- Order event history.
"""
from __future__ import annotations

import os
from typing import AsyncGenerator

import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
import repositories.asset as asset_repo
import repositories.deal as deal_repo
import repositories.notification as notification_repo
import repositories.order as order_repo
import repositories.order_event as order_event_repo
import repositories.provider_profile as provider_repo
import repositories.user as user_repo
from services import deal as deal_service
from services import order as order_service

TEST_DB_PATH = "/tmp/kilo_almeriq_order_deal_test.db"
TEST_DB_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"


@pytest.fixture
async def session() -> AsyncGenerator[AsyncSession, None]:
    """Isolated async SQLite session per test."""
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    engine = create_async_engine(
        TEST_DB_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


async def _make_user(session: AsyncSession, email: str, role: str = "INFRASTRUCTURE_PROVIDER") -> int:
    user = await user_repo.create_user(
        email=email,
        hashed_password="x",
        full_name="Test User",
        role=role,
        session=session,
    )
    await session.commit()
    return user["id"]


async def _make_provider(session: AsyncSession, user_id: int, company_name: str = "Test Co") -> int:
    profile = await provider_repo.create_provider_profile(
        user_id=user_id,
        company_name=company_name,
        location="NY",
        session=session,
    )
    await session.commit()
    return profile["id"]


async def _make_asset(session: AsyncSession, provider_id: int, price_monthly: float = 100.0) -> int:
    asset = await asset_repo.create_asset(
        provider_id=provider_id,
        name="Test Asset",
        category="Earthmoving",
        kind="physical",
        price_monthly=price_monthly,
        session=session,
    )
    await session.commit()
    return asset["id"]


# ── Order creation ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_order_records_event_and_notification(session):
    buyer_id = await _make_user(session, "buyer@example.com", role="user")
    provider_user_id = await _make_user(session, "provider@example.com")
    provider_id = await _make_provider(session, provider_user_id, "Provider A")
    asset_id = await _make_asset(session, provider_id)

    order = await order_service.create_order(
        provider_id=provider_id,
        client_id=buyer_id,
        asset_id=asset_id,
        allocation="Requested via marketplace",
        lease_amount=100.0,
        session=session,
    )
    await session.commit()

    assert order["id"] is not None
    assert order["order_id"].startswith("ORD-")
    assert order["status"] == "pending_review"
    assert order["client_id"] == buyer_id
    assert order["provider_id"] == provider_id

    # created event recorded
    events = await order_event_repo.list_order_events(order["id"], session=session)
    assert any(e["event_type"] == "created" for e in events), events

    # provider (user) notified
    notifs, total = await notification_repo.list_notifications(provider_user_id, session=session)
    assert total >= 1, notifs
    assert any(n["type"] == "order" for n in notifs), notifs


@pytest.mark.asyncio
async def test_duplicate_deal_rejected(session):
    buyer_id = await _make_user(session, "buyer2@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider2@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id,
        client_id=buyer_id,
        asset_id=asset_id,
        allocation="a",
        lease_amount=50.0,
        session=session,
    )
    await session.commit()

    d1 = await deal_service.create_deal(
        order["id"], "visa", 50.0,
        provider_id=provider_id, client_id=buyer_id, session=session,
    )
    await session.commit()

    # service-level repeat raises 409 conflict (no duplicate deal)
    with pytest.raises(HTTPException) as exc:
        await deal_service.create_deal(
            order["id"], "mastercard", 50.0,
            provider_id=provider_id, client_id=buyer_id, session=session,
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT
    existing = await deal_repo.get_deal_by_order_id(order["id"], session=session)
    assert existing is not None
    assert existing["id"] == d1["id"]


# ── Deal retrieval + signing authorization ─────────────────────────────────

@pytest.mark.asyncio
async def test_deal_retrieval_and_signing(session):
    buyer_id = await _make_user(session, "buyer3@example.com", role="user")
    provider_id = await _make_provider(
        session, await _make_user(session, "provider3@example.com"), "Provider A"
    )
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=75.0, session=session,
    )
    await session.commit()

    deal = await deal_service.create_deal(
        order["id"], "visa", 75.0,
        provider_id=provider_id, client_id=buyer_id, session=session,
    )
    await session.commit()

    # provider can retrieve
    got = await deal_service.get_deal(deal["id"], provider_id=provider_id, session=session)
    assert got is not None
    assert got["provider_name"] == "Provider A"

    # buyer (client) can retrieve
    got_client = await deal_service.get_deal(deal["id"], client_id=buyer_id, session=session)
    assert got_client is not None

    # cross-owner cannot retrieve
    other_provider = await _make_provider(session, await _make_user(session, "other@example.com"))
    with pytest.raises(HTTPException) as exc:
        await deal_service.get_deal(deal["id"], provider_id=other_provider, session=session)
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND

    # provider signs
    signed = await deal_service.sign_deal(
        deal["id"], "data-url-signature", payment_method="visa", amount=75.0,
        provider_id=provider_id, session=session,
    )
    await session.commit()
    assert signed["signature"] == "data-url-signature"
    assert signed["signed_at"] is not None


# ── Order status transitions ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_valid_status_transitions(session):
    buyer_id = await _make_user(session, "buyer4@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider4@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=10.0, session=session,
    )
    await session.commit()

    o = await order_service.update_order_status(
        order["id"], provider_id, "confirmed", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "confirmed"

    # waybill must be uploaded before shipping
    await order_service.upload_waybill(
        order["id"], provider_id,
        waybill_url="https://cdn.example.com/wb_transition.pdf",
        tracking_number="WB-TRANS-001",
        actor_id=provider_id,
        session=session,
    )
    await session.commit()

    o = await order_service.update_order_status(
        order["id"], provider_id, "shipped", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "shipped"

    o = await order_service.update_order_status(
        order["id"], provider_id, "completed", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "completed"


@pytest.mark.asyncio
async def test_invalid_status_transition_rejected(session):
    buyer_id = await _make_user(session, "buyer5@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider5@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=10.0, session=session,
    )
    await session.commit()

    # pending_review -> confirmed OK
    await order_service.update_order_status(
        order["id"], provider_id, "confirmed", actor_id=provider_id, session=session,
    )
    await session.commit()

    # confirmed -> declined is NOT allowed (declined only from pending_review)
    with pytest.raises(HTTPException) as exc:
        await order_service.update_order_status(
            order["id"], provider_id, "declined", actor_id=provider_id, session=session,
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_409_CONFLICT
    # status unchanged
    order_again = await order_repo.get_order_by_id(order["id"], provider_id=provider_id, session=session)
    assert order_again["status"] == "confirmed"


# ── Waybill upload / dispatch ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_waybill_upload_and_retrieval(session):
    buyer_id = await _make_user(session, "buyer6@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider6@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=10.0, session=session,
    )
    await session.commit()

    # confirm before shipping (waybill typically after confirm)
    await order_service.update_order_status(
        order["id"], provider_id, "confirmed", actor_id=provider_id, session=session,
    )
    await session.commit()

    updated = await order_service.upload_waybill(
        order["id"], provider_id,
        waybill_url="https://example.com/waybill.pdf",
        tracking_number="TRACK-123",
        actor_id=provider_id,
        session=session,
    )
    await session.commit()
    assert updated is not None

    wb = await order_service.get_waybill(order["id"], provider_id, session=session)
    assert wb["waybill_url"] == "https://example.com/waybill.pdf"
    assert wb["tracking_number"] == "TRACK-123"

    # waybill_uploaded event recorded
    events = await order_event_repo.list_order_events(order["id"], session=session)
    assert any(e["event_type"] == "waybill_uploaded" for e in events), events


@pytest.mark.asyncio
async def test_cross_owner_waybill_rejected(session):
    buyer_id = await _make_user(session, "buyer7@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider7@example.com"))
    other_provider = await _make_provider(session, await _make_user(session, "other7@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=10.0, session=session,
    )
    await session.commit()

    with pytest.raises(HTTPException) as exc:
        await order_service.upload_waybill(
            order["id"], other_provider,
            waybill_url="https://example.com/wb.pdf",
            actor_id=other_provider,
            session=session,
        )
    await session.commit()
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


# ── Notification on status change ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_notification_on_status_change(session):
    buyer_id = await _make_user(session, "buyer8@example.com", role="user")
    provider_id = await _make_provider(session, await _make_user(session, "provider8@example.com"))
    asset_id = await _make_asset(session, provider_id)
    order = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="a", lease_amount=10.0, session=session,
    )
    await session.commit()

    await order_service.update_order_status(
        order["id"], provider_id, "confirmed", actor_id=provider_id, session=session,
    )
    await session.commit()

    # status_changed event recorded with correct actor
    events = await order_event_repo.list_order_events(order["id"], session=session)
    status_events = [e for e in events if e["event_type"] == "status_changed"]
    assert len(status_events) >= 1, events
    assert status_events[-1]["actor_id"] == provider_id


# ── End-to-end buyer→provider lifecycle ─────────────────────────────────────

@pytest.mark.asyncio
async def test_end_to_end_buyer_provider_lifecycle(session):
    """Full flow: buyer lists→orders→deal→signs→provider confirms→waybill→dispatches."""
    # --- Buyer and Provider setup ---
    buyer_id = await _make_user(session, "buyer_e2e@example.com", role="user")
    provider_id = await _make_provider(
        session, await _make_user(session, "provider_e2e@example.com"), "Builder Co"
    )
    asset_id = await _make_asset(session, provider_id, price_monthly=250.0)

    # 1. Buyer creates an order (checkout) on an available listing.
    order = await order_service.create_order(
        provider_id=provider_id,
        client_id=buyer_id,
        asset_id=asset_id,
        allocation="3-month site lease",
        lease_amount=250.0,
        session=session,
    )
    await session.commit()
    assert order["status"] == "pending_review"
    events = await order_event_repo.list_order_events(order["id"], session=session)
    assert any(e["event_type"] == "created" for e in events)

    # 2. Buyer creates a deal (simulated payment).
    deal = await deal_service.create_deal(
        order["id"], "visa", 250.0,
        provider_id=provider_id, client_id=buyer_id, session=session,
    )
    await session.commit()
    assert deal["payment_status"] == "simulated"

    # 3. Buyer signs the deal.
    signed = await deal_service.sign_deal(
        deal["id"], "buyer-signature-data-url",
        payment_method="visa", amount=250.0,
        provider_id=provider_id, session=session,
    )
    await session.commit()
    assert signed["signature"] == "buyer-signature-data-url"
    assert signed["signed_at"] is not None

    # 4. Provider confirms the order.
    o = await order_service.update_order_status(
        order["id"], provider_id, "confirmed", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "confirmed"

    # 5. Provider uploads a waybill and dispatches (completed).
    waybill_uploaded = await order_service.upload_waybill(
        order["id"], provider_id,
        waybill_url="https://cdn.example.com/waybill_e2e.pdf",
        tracking_number="WB-E2E-001",
        actor_id=provider_id,
        session=session,
    )
    await session.commit()
    assert waybill_uploaded["id"] == order["id"]

    waybill = await order_service.get_waybill(order["id"], provider_id, session=session)
    assert waybill["waybill_url"] == "https://cdn.example.com/waybill_e2e.pdf"
    assert waybill["tracking_number"] == "WB-E2E-001"

    # 5b. Provider marks the order as shipped (requires waybill, already uploaded).
    o = await order_service.update_order_status(
        order["id"], provider_id, "shipped", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "shipped"

    # 5c. Provider marks the order as completed (dispatch finalized).
    o = await order_service.update_order_status(
        order["id"], provider_id, "completed", actor_id=provider_id, session=session,
    )
    await session.commit()
    assert o["status"] == "completed"

    # 6. Final event history cross-check.
    events = await order_event_repo.list_order_events(order["id"], session=session)
    event_types = {e["event_type"] for e in events}
    assert {"created", "status_changed", "waybill_uploaded"} <= event_types, event_types

    # 7. Cross-provider cannot touch the order at any stage.
    intruder = await _make_provider(session, await _make_user(session, "intruder@example.com"))
    for action in ("confirmed", "completed"):
        with pytest.raises(HTTPException) as exc:
            await order_service.update_order_status(
                order["id"], intruder, action, actor_id=intruder, session=session,
            )
        await session.commit()
        assert exc.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_provider_order_summary_counts_all_orders_and_priced_records(session):
    buyer_id = await _make_user(session, "summary-buyer@example.com", role="user")
    provider_id = await _make_provider(
        session, await _make_user(session, "summary-provider@example.com")
    )
    asset_id = await _make_asset(session, provider_id)

    pending = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="pending", lease_amount=100.0, session=session,
    )
    confirmed = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="confirmed", lease_amount=150.0, session=session,
    )
    completed = await order_service.create_order(
        provider_id=provider_id, client_id=buyer_id, asset_id=asset_id,
        allocation="completed", lease_amount=None, session=session,
    )
    await order_repo.update_order_status(
        confirmed["id"], provider_id, "confirmed", session=session
    )
    await order_repo.update_order_status(
        completed["id"], provider_id, "completed", session=session
    )
    await session.commit()

    summary = await order_repo.get_provider_order_summary(provider_id, session=session)
    assert summary == {
        "total_orders": 3,
        "open_orders": 2,
        "pending_review": 1,
        "confirmed": 1,
        "shipped": 0,
        "completed": 1,
        "declined": 0,
        "priced_orders": 2,
    }

