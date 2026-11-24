from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.base import Base
from repositories import provider_profile as provider_repo
from repositories import user as user_repo


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


@pytest.mark.asyncio
async def test_admin_provider_verification_is_audited_and_revocable(session: AsyncSession):
    provider_user = await user_repo.create_user(
        email="provider-audit@example.com", hashed_password="test", full_name="Provider", role="INFRASTRUCTURE_PROVIDER", session=session
    )
    admin_user = await user_repo.create_user(
        email="admin-audit@example.com", hashed_password="test", full_name="Admin", role="ADMIN", session=session
    )
    profile = await provider_repo.create_provider_profile(
        user_id=provider_user["id"], company_name="Test Infrastructure", session=session
    )

    verified = await provider_repo.update_provider_verification(
        profile_id=profile["id"], verified=True, verified_by=admin_user["id"], session=session
    )
    assert verified["verified"] is True
    assert verified["verified_at"] is not None
    assert verified["verified_by"] == admin_user["id"]
    assert verified["verification_reviewed_at"] is not None
    assert verified["verification_reviewed_by"] == admin_user["id"]

    revoked = await provider_repo.update_provider_verification(
        profile_id=profile["id"], verified=False, verified_by=admin_user["id"], session=session
    )
    assert revoked["verified"] is False
    assert revoked["verified_at"] is None
    assert revoked["verified_by"] is None
    assert revoked["verification_reviewed_at"] is not None
    assert revoked["verification_reviewed_by"] == admin_user["id"]
