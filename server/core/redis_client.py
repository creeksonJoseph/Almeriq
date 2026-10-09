"""core/redis_client.py - Upstash Redis client with in-memory fallback."""
from __future__ import annotations
import logging
import time
from typing import Any

logger = logging.getLogger(__name__)

# ── In-memory fallback store ──────────────────────────────────────────────────
_fallback: dict[str, tuple[Any, float | None]] = {}  # key -> (value, expires_at)


def _fb_set(key: str, value: str, ex: int | None = None) -> None:
    expires_at = time.time() + ex if ex else None
    _fallback[key] = (value, expires_at)


def _fb_get(key: str) -> str | None:
    entry = _fallback.get(key)
    if entry is None:
        return None
    value, expires_at = entry
    if expires_at and time.time() > expires_at:
        del _fallback[key]
        return None
    return value


def _fb_delete(key: str) -> None:
    _fallback.pop(key, None)


# ── Redis client wrapper ──────────────────────────────────────────────────────
_redis = None

try:
    from core.config import UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
    from upstash_redis import Redis
    _redis = Redis(url=UPSTASH_REDIS_URL, token=UPSTASH_REDIS_TOKEN)
    logger.info("Upstash Redis connected")
except Exception as exc:
    logger.warning("Redis unavailable, using in-memory fallback: %s", exc)


def cache_set(key: str, value: str, ex: int | None = None) -> None:
    if _redis:
        try:
            _redis.set(key, value, ex=ex)
            return
        except Exception as exc:
            logger.warning("Redis set failed, falling back: %s", exc)
    _fb_set(key, value, ex)


def cache_get(key: str) -> str | None:
    if _redis:
        try:
            return _redis.get(key)
        except Exception as exc:
            logger.warning("Redis get failed, falling back: %s", exc)
    return _fb_get(key)


def cache_delete(key: str) -> None:
    if _redis:
        try:
            _redis.delete(key)
            return
        except Exception as exc:
            logger.warning("Redis delete failed, falling back: %s", exc)
    _fb_delete(key)
