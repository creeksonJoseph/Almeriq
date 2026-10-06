"""repositories/user.py - DB queries for users table. No business rules here."""
from __future__ import annotations

import asyncpg
from core.db import get_pool


async def create_user(
    full_name: str,
    email: str,
    hashed_password: str,
    role: str = "user",
) -> dict:
    """
    Insert a new user record and return the inserted row.
    Raises asyncpg.UniqueViolationError if email already exists.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO users (full_name, email, hashed_password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, full_name, email, role, created_at
            """,
            full_name,
            email.lower().strip(),
            hashed_password,
            role,
        )
        return dict(row) if row else {}


async def get_user_by_email(email: str) -> dict | None:
    """Fetch user record including hashed_password by email."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, full_name, email, hashed_password, role, created_at
            FROM users
            WHERE email = $1
            LIMIT 1
            """,
            email.lower().strip(),
        )
        return dict(row) if row else None


async def get_user_by_id(user_id: int) -> dict | None:
    """Fetch user record without password by user_id."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, full_name, email, role, created_at
            FROM users
            WHERE id = $1
            LIMIT 1
            """,
            user_id,
        )
        return dict(row) if row else None


async def email_exists(email: str) -> bool:
    """Check if an email is already registered in the users table."""
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT 1 FROM users WHERE email = $1 LIMIT 1",
            email.lower().strip(),
        )
        return row is not None
