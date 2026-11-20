"""Asset idempotency and ownership integration tests (Phase 2)."""
from __future__ import annotations

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models.base import Base
import models.asset
import models.provider_profile
import models.user
import repositories.asset as asset_repo
from services.asset import create_asset, update_asset
from repositories.asset import get_asset_by_id, get_asset_by_client_id

TEST_DB_PATH = "/tmp/kilo_almeriq_test.db"
TEST_DB_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"


@pytest.fixture(scope="function")
async def session() -> AsyncGenerator[AsyncSession, None]:
    import os
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)
    engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        yield s
    await engine.dispose()


async def _make_provider(session: AsyncSession) -> int:
    from models.user import User
    from repositories.user import create_user
    user = await create_user(email=f"{uuid.uuid4().hex}@example.com", hashed_password="x", role="INFRASTRUCTURE_PROVIDER", session=session)
    await session.commit()
    from services.provider import create_or_update_provider_profile
    prof = await create_or_update_provider_profile(user["id"], company_name="Test Co", location="NY", session=session)
    await session.commit()
    return prof["id"]


@pytest.mark.asyncio
async def test_create_asset_with_client_id(session):
    pid = await _make_provider(session)
    asset = await create_asset(pid, name="Excavator", category="Earthmoving", kind="physical",
                               price_monthly=100.0, quantity_capacity=3, client_asset_id="cid-1", session=session)
    assert asset["id"] is not None
    assert asset["client_asset_id"] == "cid-1"
    fetched = await get_asset_by_id(asset["id"], pid, session=session)
    assert fetched is not None


@pytest.mark.asyncio
async def test_repeat_creation_is_idempotent_and_updates(session):
    pid = await _make_provider(session)
    a1 = await create_asset(pid, name="Excavator", category="Earthmoving", kind="physical",
                            price_monthly=100.0, quantity_capacity=3, client_asset_id="cid-2", session=session)
    a2 = await create_asset(pid, name="Excavator-XL", category="Earthmoving", kind="physical",
                            price_monthly=200.0, quantity_capacity=5, client_asset_id="cid-2", session=session)
    assert a2["id"] == a1["id"]
    assert a2["name"] == "Excavator-XL"
    assert a2["price_monthly"] == 200.0
    # only one row
    assets, total = await asset_repo.list_assets(provider_id=pid, session=session)
    assert total == 1


@pytest.mark.asyncio
async def test_same_name_different_client_ids_are_separate(session):
    pid = await _make_provider(session)
    a1 = await create_asset(pid, name="Excavator", category="Earthmoving", kind="physical",
                            price_monthly=100.0, client_asset_id="cid-a", session=session)
    a2 = await create_asset(pid, name="Excavator", category="Earthmoving", kind="physical",
                            price_monthly=100.0, client_asset_id="cid-b", session=session)
    assert a1["id"] != a2["id"]
    assets, total = await asset_repo.list_assets(provider_id=pid, session=session)
    assert total == 2


@pytest.mark.asyncio
async def test_same_client_id_different_providers_allowed(session):
    pid1 = await _make_provider(session)
    pid2 = await _make_provider(session)
    a1 = await create_asset(pid1, name="Excavator", category="Earthmoving", kind="physical",
                            price_monthly=100.0, client_asset_id="shared-cid", session=session)
    a2 = await create_asset(pid2, name="Excavator", category="Earthmoving", kind="physical",
                            price_monthly=100.0, client_asset_id="shared-cid", session=session)
    assert a1["id"] != a2["id"]


@pytest.mark.asyncio
async def test_legacy_null_client_id(session):
    pid = await _make_provider(session)
    asset = await create_asset(pid, name="Legacy", category="Earthmoving", kind="physical",
                               price_monthly=100.0, client_asset_id=None, session=session)
    assert asset["client_asset_id"] is None
    assets, total = await asset_repo.list_assets(provider_id=pid, kind="physical", session=session)
    assert total == 1


@pytest.mark.asyncio
async def test_provider_ownership_enforcement(session):
    pid = await _make_provider(session)
    other = await _make_provider(session)
    asset = await create_asset(pid, name="Asset", category="Cat", kind="physical",
                               price_monthly=100.0, client_asset_id="own-cid", session=session)
    # cross-provider read should return None
    got = await get_asset_by_id(asset["id"], other, session=session)
    assert got is None
    # cross-provider update should raise
    from fastapi import HTTPException
    with pytest.raises(HTTPException):
        await update_asset(asset["id"], other, name="Changed", session=session)


@pytest.mark.asyncio
async def test_unique_constraint_enforced(session):
    pid = await _make_provider(session)
    await create_asset(pid, name="A", category="C", kind="physical", price_monthly=1.0,
                       client_asset_id="uc-1", session=session)
    # service-level repeat is idempotent (returns existing)
    again = await create_asset(pid, name="A2", category="C", kind="physical", price_monthly=2.0,
                               client_asset_id="uc-1", session=session)
    assets, total = await asset_repo.list_assets(provider_id=pid, session=session)
    assert total == 1
    assert again["id"] == assets[0]["id"]
    # direct repository insert bypassing idempotency must violate the unique index
    from sqlalchemy.exc import IntegrityError
    with pytest.raises(IntegrityError):
        await asset_repo.create_asset(provider_id=pid, name="B", category="C", kind="physical",
                                      price_monthly=3.0, client_asset_id="uc-1", session=session)
        await session.commit()


@pytest.mark.asyncio
async def test_concurrent_same_client_id_one_row(session):
    pid = await _make_provider(session)
    async def make():
        return await create_asset(pid, name="Concurrent", category="Cat", kind="physical",
                                  price_monthly=9.0, client_asset_id="conc-1", session=session)
    results = await asyncio.gather(*[make() for _ in range(8)], return_exceptions=True)
    ids = [r["id"] for r in results if not isinstance(r, Exception)]
    assets, total = await asset_repo.list_assets(provider_id=pid, client_asset_id="conc-1", session=session) if False else (None, None)
    # list_assets doesn't filter by client_asset_id; query all for provider
    all_assets, total = await asset_repo.list_assets(provider_id=pid, session=session)
    conc = [a for a in all_assets if a.get("client_asset_id") == "conc-1"]
    assert len(conc) == 1, f"expected 1 row, got {len(conc)}: {conc}"
    assert len(set(ids)) == 1


@pytest.mark.asyncio
async def test_session_usable_after_failed_insert(session):
    pid = await _make_provider(session)
    await create_asset(pid, name="First", category="C", kind="physical", price_monthly=1.0,
                       client_asset_id="rec-1", session=session)
    try:
        await create_asset(pid, name="Second", category="C", kind="physical", price_monthly=2.0,
                           client_asset_id="rec-1", session=session)
    except Exception:
        pass
    # session must still work
    asset = await create_asset(pid, name="Third", category="C", kind="physical", price_monthly=3.0,
                               client_asset_id="rec-2", session=session)
    assert asset["client_asset_id"] == "rec-2"
