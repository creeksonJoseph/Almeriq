"""repositories/waitlist.py - SQLAlchemy 2.0 repository for Waitlist model."""
from __future__ import annotations
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.waitlist import Waitlist


async def create_entry(
    full_name: str,
    email: str,
    role: str,
    session: AsyncSession | None = None,
) -> Waitlist:
    """Insert a new waitlist entry using SQLAlchemy 2.0 with normalized email and name."""
    normalized_email = email.lower().strip()
    clean_name = " ".join(full_name.strip().split())
    entry = Waitlist(
        full_name=clean_name,
        email=normalized_email,
        role=role.strip(),
    )

    if session is not None:
        session.add(entry)
        await session.flush()
        return entry

    async with async_session_factory() as s:
        s.add(entry)
        await s.commit()
        await s.refresh(entry)
        return entry


async def get_by_email(email: str, session: AsyncSession | None = None) -> Waitlist | None:
    """Fetch a waitlist entry by email (case-insensitive)."""
    normalized_email = email.lower().strip()
    stmt = (
        select(Waitlist)
        .where(func.lower(Waitlist.email) == normalized_email)
        .order_by(Waitlist.id.desc())
        .limit(1)
    )

    if session is not None:
        return await session.scalar(stmt)

    async with async_session_factory() as s:
        return await s.scalar(stmt)


async def update_entry(
    email: str,
    full_name: str,
    role: str,
    session: AsyncSession | None = None,
) -> Waitlist | None:
    """Update an existing waitlist entry's full_name and role with normalized values."""
    normalized_email = email.lower().strip()
    clean_name = " ".join(full_name.strip().split())
    clean_role = role.strip()

    stmt = (
        select(Waitlist)
        .where(func.lower(Waitlist.email) == normalized_email)
        .order_by(Waitlist.id.desc())
        .limit(1)
    )

    if session is not None:
        entry = await session.scalar(stmt)
        if entry is not None:
            entry.full_name = clean_name
            entry.role = clean_role
            entry.email = normalized_email
            await session.flush()
        return entry

    async with async_session_factory() as s:
        entry = await s.scalar(stmt)
        if entry is not None:
            entry.full_name = clean_name
            entry.role = clean_role
            entry.email = normalized_email
            await s.commit()
            await s.refresh(entry)
        return entry


async def email_exists(email: str, session: AsyncSession | None = None) -> bool:
    """Check if an email exists in the waitlist (case-insensitive)."""
    stmt = (
        select(func.count())
        .select_from(Waitlist)
        .where(func.lower(Waitlist.email) == email.lower().strip())
    )

    if session is not None:
        count = await session.scalar(stmt)
        return bool(count and count > 0)

    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        return bool(count and count > 0)


async def count_all(session: AsyncSession | None = None) -> int:
    """Aggregate waitlist count in SQL."""
    stmt = select(func.count()).select_from(Waitlist)

    if session is not None:
        count = await session.scalar(stmt)
        return count or 0

    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        return count or 0
