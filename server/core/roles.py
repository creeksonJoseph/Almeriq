"""Shared role normalization helpers for backend authorization."""

from __future__ import annotations

from collections.abc import Mapping


def normalize_role(role: object) -> str:
    """Return a stable lowercase snake_case role identifier.

    Handles mixed casing and spacing from existing onboarding and admin
    role-switching flows without changing persisted user role values.
    """
    if not isinstance(role, str):
        return ""

    normalized = role.strip().casefold().replace("-", " ")
    return "_".join(normalized.split())


def user_has_role(user: Mapping[str, object], expected_role: str) -> bool:
    """Check a user's role using the shared normalization rules."""
    return normalize_role(user.get("role")) == normalize_role(expected_role)
