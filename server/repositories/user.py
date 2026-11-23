"""repositories/user.py - SQLAlchemy 2.0 repository for User model."""
from __future__ import annotations
import logging
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.user import User

logger = logging.getLogger(__name__)


async def create_user(
    email: str,
    hashed_password: str | None = None,
    full_name: str | None = None,
    google_id: str | None = None,
    role: str = "user",
    is_admin: bool = False,
    session: AsyncSession | None = None,
) -> dict:
    """Phase 1: Create a new minimal user record."""
    logger.info(f"[REPO-CREATE-USER] Starting for email: {email}")
    
    user = User(
        email=email.lower().strip(),
        hashed_password=hashed_password,
        full_name=full_name,
        google_id=google_id,
        role=role,
        is_admin=is_admin,
        onboarding_completed=False,
    )
    logger.info(f"[REPO-CREATE-USER] User object created: {user.email}")

    if session is not None:
        logger.info(f"[REPO-CREATE-USER] Using provided session")
        session.add(user)
        await session.flush()
        logger.info(f"[REPO-CREATE-USER] User flushed to session. ID: {user.id}")
        return user.to_dict()

    logger.info(f"[REPO-CREATE-USER] Creating new session")
    async with async_session_factory() as s:
        s.add(user)
        logger.info(f"[REPO-CREATE-USER] User added to session")
        await s.commit()
        logger.info(f"[REPO-CREATE-USER] Commit successful. User ID: {user.id}")
        await s.refresh(user)
        logger.info(f"[REPO-CREATE-USER] User refreshed from DB")
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


async def link_google_id(
    user_id: int,
    google_id: str,
    full_name: str | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    """Attach Google account to an existing email/password user."""
    values: dict = {"google_id": google_id}
    if full_name is not None:
        values["full_name"] = full_name
    stmt = update(User).where(User.id == user_id).values(**values).returning(User)

    if session is not None:
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        return user.to_dict() if user else None

    async with async_session_factory() as s:
        res = await s.execute(stmt)
        await s.commit()
        user = res.scalar_one_or_none()
        return user.to_dict() if user else None


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
    logger.info(f"[REPO-EMAIL-EXISTS] Checking email: {email}")
    stmt = select(func.count()).select_from(User).where(func.lower(User.email) == email.lower().strip())

    if session is not None:
        logger.info(f"[REPO-EMAIL-EXISTS] Using provided session")
        count = await session.scalar(stmt)
        exists = bool(count and count > 0)
        logger.info(f"[REPO-EMAIL-EXISTS] Result: {exists} (count: {count})")
        return exists

    logger.info(f"[REPO-EMAIL-EXISTS] Creating new session")
    async with async_session_factory() as s:
        count = await s.scalar(stmt)
        exists = bool(count and count > 0)
        logger.info(f"[REPO-EMAIL-EXISTS] Result: {exists} (count: {count})")
        return exists


async def update_user_password(
    user_id: int,
    hashed_password: str,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update a user's hashed password."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(hashed_password=hashed_password)
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


async def update_user_role(
    user_id: int,
    role: str,
    session: AsyncSession | None = None,
) -> dict | None:
    """Update a user's role without changing their admin privileges."""
    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(role=role, onboarding_completed=True)
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


async def get_user_names_by_ids(
    user_ids: list[int],
    session: AsyncSession | None = None,
) -> dict[int, str | None]:
    """Fetch only display names for a set of users in one query."""
    ids = set(user_ids)
    if not ids:
        return {}
    stmt = select(User.id, User.full_name).where(User.id.in_(ids))
    if session is not None:
        rows = (await session.execute(stmt)).all()
    else:
        async with async_session_factory() as db:
            rows = (await db.execute(stmt)).all()
    return {user_id: full_name for user_id, full_name in rows}
