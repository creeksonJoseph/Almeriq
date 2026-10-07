"""core/db.py - SQLAlchemy 2.0 AsyncEngine & async_sessionmaker."""
from __future__ import annotations
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from .config import DATABASE_URL

# Normalize URL for asyncpg dialect
_db_url = DATABASE_URL
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql://") and not _db_url.startswith("postgresql+asyncpg://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

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
