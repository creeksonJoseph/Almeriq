"""repositories/founder_ai_cache.py - Cache store for AI-generated founder deliverables."""
from __future__ import annotations
import hashlib
import json
import logging
from sqlalchemy import select
from core.db import async_session_factory
from models.founder_ai_cache import FounderAiCache

logger = logging.getLogger(__name__)


def compute_content_hash(data: dict) -> str:
    """Stable hash of key founder inputs to determine if cache is valid."""
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


async def get_cached_tool_result(user_id: int, tool_key: str, content_hash: str) -> dict | None:
    async with async_session_factory() as s:
        stmt = (
            select(FounderAiCache)
            .where(
                FounderAiCache.user_id == user_id,
                FounderAiCache.tool_key == tool_key,
                FounderAiCache.content_hash == content_hash,
            )
            .limit(1)
        )
        row = await s.scalar(stmt)
        if row:
            try:
                return json.loads(row.result_json)
            except Exception:
                return None
        return None


async def save_cached_tool_result(
    user_id: int,
    tool_key: str,
    content_hash: str,
    result: dict,
    source: str = "gemini",
) -> None:
    async with async_session_factory() as s:
        stmt = (
            select(FounderAiCache)
            .where(
                FounderAiCache.user_id == user_id,
                FounderAiCache.tool_key == tool_key,
                FounderAiCache.content_hash == content_hash,
            )
            .limit(1)
        )
        existing = await s.scalar(stmt)
        if existing:
            existing.result_json = json.dumps(result)
            existing.source = source
        else:
            entry = FounderAiCache(
                user_id=user_id,
                tool_key=tool_key,
                content_hash=content_hash,
                result_json=json.dumps(result),
                source=source,
            )
            s.add(entry)
        await s.commit()
