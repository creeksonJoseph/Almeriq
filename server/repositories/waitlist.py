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
    """Insert a new waitlist entry using SQLAlchemy 2.0."""
    normalized_email = email.lower().strip()
    entry = Waitlist(
        full_name=full_name.strip(),
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


async def email_exists(email: str, session: AsyncSession | None = None) -> bool:
    """Check if an email exists in the waitlist."""
    stmt = select(func.count()).select_from(Waitlist).where(Waitlist.email == email.lower().strip())

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
