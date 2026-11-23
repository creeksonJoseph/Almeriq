"""Regression tests for mixed-case user roles at authorization boundaries."""

from __future__ import annotations

import pytest
from fastapi import HTTPException, status

import api.dependencies as dependencies
from api.routers.founder import _require_founder
from core.roles import normalize_role, user_has_role


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("FOUNDER", "founder"),
        (" founder ", "founder"),
        ("Infrastructure Provider", "infrastructure_provider"),
        ("INFRASTRUCTURE_PROVIDER", "infrastructure_provider"),
        ("Job-Seeker", "job_seeker"),
        ("Investor", "investor"),
        (None, ""),
        (123, ""),
    ],
)
def test_normalize_role(value, expected):
    assert normalize_role(value) == expected


@pytest.mark.parametrize("role", ["founder", "FOUNDER", " Founder "])
def test_founder_workspace_accepts_normalized_founder_role(role):
    assert _require_founder({"id": 42, "role": role}) == 42


@pytest.mark.parametrize("role", ["INVESTOR", "JOB_SEEKER", "INFRASTRUCTURE_PROVIDER", None])
def test_founder_workspace_rejects_non_founder_roles(role):
    with pytest.raises(HTTPException) as exc:
        _require_founder({"id": 42, "role": role})
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "role",
    ["INFRASTRUCTURE_PROVIDER", "infrastructure_provider", "Infrastructure Provider"],
)
async def test_provider_dependency_accepts_normalized_provider_role(role):
    user = {"id": 7, "role": role}
    assert await dependencies.get_current_provider_user(user) == user


@pytest.mark.asyncio
async def test_provider_dependency_rejects_founder():
    with pytest.raises(HTTPException) as exc:
        await dependencies.get_current_provider_user({"id": 7, "role": "FOUNDER"})
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_job_owner_accepts_uppercase_founder():
    owner = await dependencies.get_current_job_owner(
        db=None, current_user={"id": 17, "role": "FOUNDER"}
    )
    assert owner == {"provider_id": None, "founder_user_id": 17}


@pytest.mark.asyncio
async def test_job_owner_accepts_uppercase_provider(monkeypatch):
    async def fake_get_provider_profile(user_id, session=None):
        assert user_id == 18
        return {"id": 91}

    monkeypatch.setattr(
        dependencies.provider_repo,
        "get_provider_profile_by_user_id",
        fake_get_provider_profile,
    )
    owner = await dependencies.get_current_job_owner(
        db=None, current_user={"id": 18, "role": "INFRASTRUCTURE_PROVIDER"}
    )
    assert owner == {"provider_id": 91, "founder_user_id": None}


@pytest.mark.asyncio
async def test_job_owner_rejects_unrelated_role():
    with pytest.raises(HTTPException) as exc:
        await dependencies.get_current_job_owner(
            db=None, current_user={"id": 19, "role": "INVESTOR"}
        )
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_admin_access_still_depends_on_is_admin_flag():
    with pytest.raises(HTTPException) as exc:
        await dependencies.get_current_admin_user(
            {"id": 20, "role": "ADMIN", "is_admin": False}
        )
    assert exc.value.status_code == status.HTTP_403_FORBIDDEN

    admin = {"id": 21, "role": "FOUNDER", "is_admin": True}
    assert await dependencies.get_current_admin_user(admin) == admin


def test_user_has_role_does_not_treat_admin_flag_as_a_role():
    assert not user_has_role({"role": "INVESTOR", "is_admin": True}, "founder")
