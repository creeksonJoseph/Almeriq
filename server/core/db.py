"""core/db.py - SQLAlchemy 2.0 AsyncEngine & async_sessionmaker."""
from __future__ import annotations
from typing import AsyncGenerator
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from .config import DATABASE_URL


VALID_ASYNCPG_QUERY_PARAMS = {
    "ssl",
    "timeout",
    "command_timeout",
    "statement_cache_size",
    "max_cached_statement_lifetime",
    "max_cacheable_statement_size",
    "server_settings",
}


def _normalize_database_url(url: str) -> str:
    """
    Normalize DATABASE_URL for asyncpg:
    1. Converts postgres:// or postgresql:// scheme to postgresql+asyncpg://
    2. Converts sslmode parameter to ssl (asyncpg rejects sslmode).
    3. Strips unsupported libpq query parameters like channel_binding or gssencmode.
    """
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    if not parsed.query:
        return url

    qs = parse_qs(parsed.query)
    filtered: dict[str, list[str]] = {}

    # Translate sslmode to ssl
    if "sslmode" in qs and "ssl" not in qs:
        mode = qs["sslmode"][0].lower()
        if mode in ("disable", "allow"):
            filtered["ssl"] = ["disable"]
        else:
            # require, verify-ca, verify-full, prefer
            filtered["ssl"] = ["require"]
    elif "ssl" in qs:
        filtered["ssl"] = qs["ssl"]

    # Filter to only parameters asyncpg accepts
    for key, val in qs.items():
        if key in VALID_ASYNCPG_QUERY_PARAMS and key not in filtered:
            filtered[key] = val

    new_query = urlencode(filtered, doseq=True)
    return urlunparse(parsed._replace(query=new_query))


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
