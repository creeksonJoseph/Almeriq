"""Authentication service tests (Phase 1 register/login + Phase 2 onboarding).

Exercises the auth service directly against an isolated SQLite database. Because
``register_user``/``authenticate_user``/``update_onboarding`` bind to
``core.db.async_session_factory`` (they accept no session argument), the fixture
monkeypatches ``repositories.user.async_session_factory`` to the isolated test
factory so no production/dev data is ever touched.
"""
from __future__ import annotations

from typing import AsyncGenerator

import pytest
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import core.db as core_db
from models.base import Base
import repositories.user as user_repo
from services import auth as auth_service


@pytest.fixture
async def session(tmp_path) -> AsyncGenerator[AsyncSession, None]:
    """Isolated async SQLite session per test, wired into the session-less auth
    service calls via the repository module's session factory."""
    engine = create_async_engine(
        f"sqlite+aiosqlite:///{tmp_path / 'auth.db'}",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    original_factory = user_repo.async_session_factory
    user_repo.async_session_factory = factory
    try:
        async with factory() as db:
            yield db
    finally:
        user_repo.async_session_factory = original_factory
        await engine.dispose()


# ── Registration ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_register_user_creates_account_and_token(session):
    user, token = await auth_service.register_user(
        email="founder@example.com", password="SecurePassword123!"
    )
    assert user["email"] == "founder@example.com"
    assert user["role"] == "user"
    assert user["onboarding_completed"] is False
    assert isinstance(token, str) and len(token) > 0


@pytest.mark.asyncio
async def test_register_normalizes_email_and_rejects_duplicate(session):
    await auth_service.register_user(
        email="Dup@Example.Com", password="SecurePassword123!"
    )
    with pytest.raises(HTTPException) as exc:
        await auth_service.register_user(
            email="dup@example.com", password="SecurePassword123!"
        )
    assert exc.value.status_code == status.HTTP_409_CONFLICT


# ── Login ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_authenticate_user_valid_credentials(session):
    await auth_service.register_user(
        email="login@example.com", password="SecurePassword123!"
    )
    user, token = await auth_service.authenticate_user(
        email="login@example.com", password="SecurePassword123!"
    )
    assert user["email"] == "login@example.com"
    assert isinstance(token, str) and len(token) > 0


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(session):
    await auth_service.register_user(
        email="pw@example.com", password="SecurePassword123!"
    )
    with pytest.raises(HTTPException) as exc:
        await auth_service.authenticate_user(
            email="pw@example.com", password="WrongPassword123!"
        )
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_authenticate_user_unknown_email(session):
    with pytest.raises(HTTPException) as exc:
        await auth_service.authenticate_user(
            email="nope@example.com", password="SecurePassword123!"
        )
    assert exc.value.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_authenticate_google_only_account_rejects_password(session):
    await user_repo.create_user(
        email="google@example.com", hashed_password=None, session=session
    )
    with pytest.raises(HTTPException) as exc:
        await auth_service.authenticate_user(
            email="google@example.com", password="anything"
        )
    assert exc.value.status_code == status.HTTP_400_BAD_REQUEST


# ── Onboarding ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_update_onboarding_sets_role_and_marks_complete(session):
    user, _ = await auth_service.register_user(
        email="onboard@example.com", password="SecurePassword123!"
    )
    updated = await auth_service.update_onboarding(
        user_id=user["id"],
        full_name="Ada Founder",
        id_number="ID-123",
        role="founder",
    )
    assert updated["role"] == "founder"
    assert updated["full_name"] == "Ada Founder"
    assert updated["id_number"] == "ID-123"
    assert updated["onboarding_completed"] is True


@pytest.mark.asyncio
async def test_update_onboarding_incomplete_when_no_role_or_id(session):
    user, _ = await auth_service.register_user(
        email="partial@example.com", password="SecurePassword123!"
    )
    updated = await auth_service.update_onboarding(
        user_id=user["id"], full_name="Only Name"
    )
    assert updated["onboarding_completed"] is False


@pytest.mark.asyncio
async def test_update_onboarding_missing_user(session):
    with pytest.raises(HTTPException) as exc:
        await auth_service.update_onboarding(user_id=999999, role="founder")
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_get_user_profile_missing(session):
    with pytest.raises(HTTPException) as exc:
        await auth_service.get_user_profile(user_id=999999)
    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_onboarding_role_selection_completes_onboarding(session):
    user, _ = await auth_service.register_user(
        email="role-only@example.com", password="SecurePassword123!"
    )
    updated = await auth_service.update_onboarding(
        user_id=user["id"], role="INFRASTRUCTURE_PROVIDER"
    )
    assert updated["role"] == "INFRASTRUCTURE_PROVIDER"
    assert updated["onboarding_completed"] is True


@pytest.mark.asyncio
async def test_update_onboarding_rejects_unsupported_role(session):
    user, _ = await auth_service.register_user(
        email="invalid-role@example.com", password="SecurePassword123!"
    )
    with pytest.raises(HTTPException) as exc:
        await auth_service.update_onboarding(
            user_id=user["id"], role="super_admin"
        )
    assert exc.value.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
