"""core/db.py - SQLAlchemy 2.0 AsyncEngine & async_sessionmaker."""
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
    """Convert postgres/postgresql scheme to postgresql+psycopg: for native libpq & Neon DB support."""
    return re.sub(r"^(postgres|postgresql)(\+[^:]+)?:", "postgresql+psycopg:", url)


_db_url = _normalize_database_url(DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=False,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
)

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
