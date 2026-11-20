"""Asset idempotency and ownership integration tests (Phase 2).

All tests use an isolated SQLite database created under pytest's tmp_path so no
test ever touches the development or production database. SQLite is the
development/test engine; PostgreSQL concurrency is NOT tested here.
"""
from __future__ import annotations

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
import repositories.asset as asset_repo
from services.asset import create_asset, delete_asset, update_asset
from repositories.asset import get_asset_by_id, get_asset_by_client_id, list_assets


def _make_db_url(tmp_path) -> str:
    return f"sqlite+aiosqlite:///{tmp_path / 'test.db'}"


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    """Isolated async SQLite session per test."""
    engine = create_async_engine(
        _make_db_url(tmp_path),
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


async def _make_provider(session: AsyncSession) -> int:
    from repositories.user import create_user
    from services.provider import create_or_update_provider_profile

    user = await create_user(
        email=f"{uuid.uuid4().hex}@example.com",
        hashed_password="x",
        role="INFRASTRUCTURE_PROVIDER",
        session=session,
    )
    await session.commit()
    prof = await create_or_update_provider_profile(
        user["id"], company_name="Test Co", location="NY", session=session
    )
    await session.commit()
    return prof["id"]


@pytest.mark.asyncio
async def test_create_asset_with_client_id(session):
    pid = await _make_provider(session)
    asset = await create_asset(
        pid, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, quantity_capacity=3, client_asset_id="cid-1", session=session,
    )
    await session.commit()
    assert asset["id"] is not None
    assert asset["client_asset_id"] == "cid-1"
    fetched = await get_asset_by_id(asset["id"], pid, session=session)
    assert fetched is not None


@pytest.mark.asyncio
async def test_repeat_creation_is_idempotent_and_updates(session):
    pid = await _make_provider(session)
    a1 = await create_asset(
        pid, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, quantity_capacity=3, client_asset_id="cid-2", session=session,
    )
    await session.commit()
    a2 = await create_asset(
        pid, name="Excavator-XL", category="Earthmoving", kind="physical",
        price_monthly=200.0, quantity_capacity=5, client_asset_id="cid-2", session=session,
    )
    await session.commit()
    assert a2["id"] == a1["id"]
    assert a2["name"] == "Excavator-XL"
    assert a2["price_monthly"] == 200.0
    assets, total = await list_assets(provider_id=pid, session=session)
    assert total == 1


@pytest.mark.asyncio
async def test_same_name_different_client_ids_are_separate(session):
    pid = await _make_provider(session)
    a1 = await create_asset(
        pid, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, client_asset_id="cid-a", session=session,
    )
    a2 = await create_asset(
        pid, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, client_asset_id="cid-b", session=session,
    )
    await session.commit()
    assert a1["id"] != a2["id"]
    assets, total = await list_assets(provider_id=pid, session=session)
    assert total == 2


@pytest.mark.asyncio
async def test_same_client_id_different_providers_allowed(session):
    pid1 = await _make_provider(session)
    pid2 = await _make_provider(session)
    a1 = await create_asset(
        pid1, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, client_asset_id="shared-cid", session=session,
    )
    a2 = await create_asset(
        pid2, name="Excavator", category="Earthmoving", kind="physical",
        price_monthly=100.0, client_asset_id="shared-cid", session=session,
    )
    await session.commit()
    assert a1["id"] != a2["id"]


@pytest.mark.asyncio
async def test_legacy_null_client_id(session):
    pid = await _make_provider(session)
    asset = await create_asset(
        pid, name="Legacy", category="Earthmoving", kind="physical",
        price_monthly=100.0, client_asset_id=None, session=session,
    )
    await session.commit()
    assert asset["client_asset_id"] is None
    assets, total = await list_assets(provider_id=pid, kind="physical", session=session)
    assert total == 1


@pytest.mark.asyncio
async def test_provider_ownership_read_enforcement(session):
    pid = await _make_provider(session)
    other = await _make_provider(session)
    asset = await create_asset(
        pid, name="Asset", category="Cat", kind="physical",
        price_monthly=100.0, client_asset_id="own-cid", session=session,
    )
    await session.commit()
    # cross-provider read should return None
    got = await get_asset_by_id(asset["id"], other, session=session)
    assert got is None


@pytest.mark.asyncio
async def test_provider_ownership_update_enforcement(session):
    pid = await _make_provider(session)
    other = await _make_provider(session)
    asset = await create_asset(
        pid, name="Asset", category="Cat", kind="physical",
        price_monthly=100.0, client_asset_id="own-cid", session=session,
    )
    await session.commit()
    # cross-provider update should raise
    with pytest.raises(HTTPException):
        await update_asset(asset["id"], other, name="Changed", session=session)
    await session.commit()
    # owner row must be unchanged
    got = await get_asset_by_id(asset["id"], pid, session=session)
    assert got["name"] == "Asset"


@pytest.mark.asyncio
async def test_successful_asset_deletion(session):
    pid = await _make_provider(session)
    asset = await create_asset(
        pid, name="ToDelete", category="Cat", kind="physical",
        price_monthly=100.0, client_asset_id="del-cid", session=session,
    )
    await session.commit()
    result = await delete_asset(asset["id"], pid, session=session)
    await session.commit()
    assert result is None  # service returns None on success
    got = await get_asset_by_id(asset["id"], pid, session=session)
    assert got is None


@pytest.mark.asyncio
async def test_cross_provider_deletion_prevention(session):
    pid = await _make_provider(session)
    other = await _make_provider(session)
    asset = await create_asset(
        pid, name="Asset", category="Cat", kind="physical",
        price_monthly=100.0, client_asset_id="xdel-cid", session=session,
    )
    await session.commit()
    # other provider cannot delete
    with pytest.raises(HTTPException):
        await delete_asset(asset["id"], other, session=session)
    await session.commit()
    # asset still retrievable by owner
    got = await get_asset_by_id(asset["id"], pid, session=session)
    assert got is not None


@pytest.mark.asyncio
async def test_deleted_asset_cannot_be_retrieved(session):
    pid = await _make_provider(session)
    asset = await create_asset(
        pid, name="Gone", category="Cat", kind="physical",
        price_monthly=100.0, client_asset_id="gone-cid", session=session,
    )
    await session.commit()
    await delete_asset(asset["id"], pid, session=session)
    await session.commit()
    got = await get_asset_by_id(asset["id"], pid, session=session)
    assert got is None


@pytest.mark.asyncio
async def test_unique_constraint_enforced_at_database(session):
    pid = await _make_provider(session)
    await create_asset(
        pid, name="A", category="C", kind="physical", price_monthly=1.0,
        client_asset_id="uc-1", session=session,
    )
    await session.commit()
    # service-level repeat is idempotent (returns existing)
    again = await create_asset(
        pid, name="A2", category="C", kind="physical", price_monthly=2.0,
        client_asset_id="uc-1", session=session,
    )
    await session.commit()
    assert again["id"] is not None
    assets, total = await list_assets(provider_id=pid, session=session)
    assert total == 1
    assert again["id"] == assets[0]["id"]
    # direct repository insert bypassing idempotency must violate the unique index
    with pytest.raises(IntegrityError):
        await asset_repo.create_asset(
            provider_id=pid, name="B", category="C", kind="physical",
            price_monthly=3.0, client_asset_id="uc-1", session=session,
        )
        await session.flush()


@pytest.mark.asyncio
async def test_session_usable_after_failed_insert(session):
    pid = await _make_provider(session)
    await create_asset(
        pid, name="First", category="C", kind="physical", price_monthly=1.0,
        client_asset_id="rec-1", session=session,
    )
    await session.commit()
    # deliberately trigger an IntegrityError via a duplicate client_asset_id
    with pytest.raises(IntegrityError):
        await asset_repo.create_asset(
            provider_id=pid, name="Second", category="C", kind="physical",
            price_monthly=2.0, client_asset_id="rec-1", session=session,
        )
        await session.flush()
    # roll back the failed savepoint-level transaction so the session is usable
    await session.rollback()
    # session must still work
    asset = await create_asset(
        pid, name="Third", category="C", kind="physical", price_monthly=3.0,
        client_asset_id="rec-2", session=session,
    )
    await session.commit()
    assert asset["client_asset_id"] == "rec-2"


@pytest.mark.asyncio
async def test_concurrent_same_client_id_one_row(session, tmp_path):
    pid = await _make_provider(session)
    await session.commit()

    # Separate engine pointing to the same SQLite database file. Multiple
    # connections allow concurrent writes to serialize through SQLite's file
    # lock, reproducing the concurrent-request scenario.
    engine = create_async_engine(
        _make_db_url(tmp_path),
        connect_args={"check_same_thread": False},
    )
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def make():
        async with factory() as s:
            asset = await create_asset(
                pid, name="Concurrent", category="Cat", kind="physical",
                price_monthly=9.0, client_asset_id="conc-1", session=s,
            )
            await s.commit()
            return asset

    results = await asyncio.gather(*[make() for _ in range(8)])

    # All eight operations succeeded (gather would have raised otherwise)
    assert len(results) == 8

    # All eight responses must contain the same asset ID
    ids = [r["id"] for r in results]
    assert len(set(ids)) == 1, f"expected one asset id, got {set(ids)}"

    # Exactly one matching database record must exist
    assets, total = await list_assets(provider_id=pid, session=session)
    conc = [a for a in assets if a.get("client_asset_id") == "conc-1"]
    assert len(conc) == 1, f"expected 1 row, got {len(conc)}: {conc}"
    assert conc[0]["id"] == ids[0]

    await engine.dispose()
