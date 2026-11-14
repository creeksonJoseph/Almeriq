"""core/db.py - SQLAlchemy 2.0 AsyncEngine & async_sessionmaker (dialect-neutral)."""
from __future__ import annotations
import re
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from .config import DATABASE_URL


def _normalize_database_url(url: str) -> str:
    """Convert postgres/postgresql scheme to postgresql+psycopg for Neon DB support."""
    return re.sub(r"^(postgres|postgresql)(\+[^:]+)?:", "postgresql+psycopg:", url)


def _get_engine_kwargs(url: str) -> dict:
    """Return dialect-appropriate engine kwargs."""
    normalized = _normalize_database_url(url)
    is_sqlite = normalized.startswith("sqlite")
    is_postgres = normalized.startswith("postgresql")

    kwargs = {
        "echo": False,
        "pool_pre_ping": True,
    }

    if is_sqlite:
        # SQLite doesn't use pool_size/max_overflow the same way
        # check_same_thread=False allows multiple threads to use the connection
        kwargs["connect_args"] = {"check_same_thread": False}
    elif is_postgres:
        kwargs["pool_size"] = 10
        kwargs["max_overflow"] = 5
        # Neon requires sslmode=require; typically passed in URL, but can be added here
        # if not already present in the URL query params
        if "sslmode" not in normalized:
            kwargs.setdefault("connect_args", {})["sslmode"] = "require"

    return kwargs


_db_url = _normalize_database_url(DATABASE_URL)
_engine_kwargs = _get_engine_kwargs(DATABASE_URL)

engine = create_async_engine(_db_url, **_engine_kwargs)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for obtaining an isolated AsyncSession per request."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def close_db() -> None:
    """Dispose the engine and close pooled connections cleanly at shutdown."""
    await engine.dispose()


# Backward-compatibility helpers during transition
async def init_pool() -> None:
    pass


async def close_pool() -> None:
    await close_db()


def get_pool():
    return None