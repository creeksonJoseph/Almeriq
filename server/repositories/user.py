"""repositories/user.py - SQLAlchemy 2.0 repository for User model."""
from __future__ import annotations
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.user import User


async def create_user(
    email: str,
    hashed_password: str | None = None,
    full_name: str | None = None,
    google_id: str | None = None,
    role: str = "user",
    session: AsyncSession | None = None,
) -> dict:
    """Phase 1: Create a new minimal user record."""
    user = User(
        email=email.lower().strip(),
        hashed_password=hashed_password,
        full_name=full_name,
        google_id=google_id,
        role=role,
        onboarding_completed=False,
    )

    if session is not None:
        session.add(user)
        await session.flush()
        return user.to_dict()

    async with async_session_factory() as s:
        s.add(user)
        await s.commit()
        await s.refresh(user)
        return user.to_dict()


async def get_user_by_email(
    email: str,
    include_sensitive: bool = True,
    session: AsyncSession | None = None,
) -> dict | None:
    """Fetch user record by email (case-insensitive)."""
    stmt = select(User).where(func.lower(User.email) == email.lower().strip()).limit(1)

    if session is not None:
        user = await session.scalar(stmt)
        return user.to_dict(include_sensitive=include_sensitive) if user else None

    async with async_session_factory() as s:
        user = await s.scalar(stmt)
        return user.to_dict(include_sensitive=include_sensitive) if user else None


async def get_user_by_google_id(google_id: str, session: AsyncSession | None = None) -> dict | None:
    """Fetch user record by Google ID."""
    stmt = select(User).where(User.google_id == google_id).limit(1)

    if session is not None:
        user = await session.scalar(stmt)
        return user.to_dict() if user else None

    async with async_session_factory() as s:
        user = await s.scalar(stmt)
        return user.to_dict() if user else None


async def get_user_by_id(user_id: int, session: AsyncSession | None = None) -> dict | None:
    """Fetch user record by user_id."""
    stmt = select(User).where(User.id == user_id).limit(1)

    if session is not None:
        user = await session.scalar(stmt)
        return user.to_dict() if user else None

    async with async_session_factory() as s:
        user = await s.scalar(stmt)
        return user.to_dict() if user else None


async def email_exists(email: str, session: AsyncSession | None = None) -> bool:
    """Check if an email is already registered (case-insensitive)."""
    stmt = select(func.count()).select_from(User).where(func.lower(User.email) == email.lower().strip())

    if session is not None:
        count = await session.scalar(stmt)
        return bool(count and count > 0)

    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        return bool(count and count > 0)


async def update_user_onboarding(
    user_id: int,
    full_name: str | None = None,
    nationality: str | None = None,
    id_number: str | None = None,
    role: str | None = None,
    onboarding_completed: bool = False,
    session: AsyncSession | None = None,
) -> dict | None:
    """Phase 2: Update onboarding questionnaire responses for user."""
    values: dict = {"onboarding_completed": onboarding_completed}
    if full_name is not None:
        values["full_name"] = full_name
    if nationality is not None:
        values["nationality"] = nationality
    if id_number is not None:
        values["id_number"] = id_number
    if role is not None:
        values["role"] = role

    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(**values)
        .returning(User)
    )

    if session is not None:
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        return user.to_dict() if user else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        user = res.scalar_one_or_none()
        return user.to_dict() if user else None
