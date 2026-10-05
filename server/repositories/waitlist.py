"""repositories/waitlist.py - all DB queries for the waitlist table. No business rules here."""
from __future__ import annotations
import asyncpg
from core.db import get_pool


async def create_entry(full_name: str, email: str, role: str) -> None:
    """
    Insert a new waitlist row.
    Raises asyncpg.UniqueViolationError if the email already exists.

    Index note (§2):
      - email: already covered by UNIQUE constraint (B-tree index).
      - joined_at: indexed for chronological queries / dashboard sorting.
        Created in _ensure_schema() at startup.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO waitlist (full_name, email, role) VALUES ($1, $2, $3)",
            full_name,
            email,
            role,
        )


async def email_exists(email: str) -> bool:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT 1 FROM waitlist WHERE email = $1 LIMIT 1", email
        )
        return row is not None


async def count_all() -> int:
    """Aggregate in SQL - never load rows to len() them (§3)."""
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval("SELECT COUNT(*) FROM waitlist") or 0
