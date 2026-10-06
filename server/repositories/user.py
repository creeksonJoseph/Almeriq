"""repositories/user.py - DB queries for users table supporting 2-phase onboarding and Google OAuth."""
from __future__ import annotations

import asyncpg
from core.db import get_pool


async def create_user(
    email: str,
    hashed_password: str | None = None,
    full_name: str | None = None,
    google_id: str | None = None,
    role: str = "user",
) -> dict:
    """
    Phase 1: Insert a new minimal user record.
    Returns inserted user row dictionary.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (email, hashed_password, full_name, google_id, role, onboarding_completed)
            VALUES ($1, $2, $3, $4, $5, FALSE)
            RETURNING id, email, full_name, nationality, id_number, role, onboarding_completed, created_at
            """,
            email.lower().strip(),
            hashed_password,
            full_name,
            google_id,
            role,
        )
        return dict(row) if row else {}


async def get_user_by_email(email: str) -> dict | None:
    """Fetch complete user record by email."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, hashed_password, full_name, nationality, id_number, role, onboarding_completed, google_id, created_at
            FROM users
            WHERE email = $1
            LIMIT 1
            """,
            email.lower().strip(),
        )
        return dict(row) if row else None


async def get_user_by_google_id(google_id: str) -> dict | None:
    """Fetch user record by Google ID."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, hashed_password, full_name, nationality, id_number, role, onboarding_completed, google_id, created_at
            FROM users
            WHERE google_id = $1
            LIMIT 1
            """,
            google_id,
        )
        return dict(row) if row else None


async def get_user_by_id(user_id: int) -> dict | None:
    """Fetch public user record by user_id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, email, full_name, nationality, id_number, role, onboarding_completed, created_at
            FROM users
            WHERE id = $1
            LIMIT 1
            """,
            user_id,
        )
        return dict(row) if row else None


async def email_exists(email: str) -> bool:
    """Check if an email is already registered."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT 1 FROM users WHERE email = $1 LIMIT 1",
            email.lower().strip(),
        )
        return row is not None


async def update_user_onboarding(
    user_id: int,
    full_name: str | None = None,
    nationality: str | None = None,
    id_number: str | None = None,
    role: str | None = None,
    onboarding_completed: bool = False,
) -> dict:
    """
    Phase 2: Update onboarding details step by step or on completion.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE users
            SET full_name = COALESCE($2, full_name),
                nationality = COALESCE($3, nationality),
                id_number = COALESCE($4, id_number),
                role = COALESCE($5, role),
                onboarding_completed = CASE WHEN $6 IS TRUE THEN TRUE ELSE onboarding_completed END
            WHERE id = $1
            RETURNING id, email, full_name, nationality, id_number, role, onboarding_completed, created_at
            """,
            user_id,
            full_name,
            nationality,
            id_number,
            role,
            onboarding_completed,
        )
        return dict(row) if row else {}
