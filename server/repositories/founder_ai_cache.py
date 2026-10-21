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


async def list_cached_tool_keys(user_id: int, content_hash: str) -> list[str]:
    """Return all tool_keys that have been run for the given content_hash (i.e. this brief).
    content_hash here should be the per-tool hash (includes tool_key in the data)."""
    async with async_session_factory() as s:
        stmt = (
            select(FounderAiCache.tool_key)
            .where(
                FounderAiCache.user_id == user_id,
                FounderAiCache.content_hash == content_hash,
            )
        )
        rows = (await s.execute(stmt)).scalars().all()
        return list(rows)


async def get_analyses_run_for_brief(user_id: int, brief: dict) -> list[str]:
    """Return which of the 4 tool_keys have a cached result for this brief."""
    tool_keys = ["market_analysis", "feasibility_analysis", "business_plan", "execution_roadmap"]
    run: list[str] = []
    for key in tool_keys:
        h = compute_content_hash({
            "tool_key": key,
            "idea": brief.get("idea", ""),
            "customer": brief.get("customer", ""),
            "location": brief.get("location", ""),
            "problem": brief.get("problem", ""),
            "solution": brief.get("solution", ""),
        })
        result = await get_cached_tool_result(user_id, key, h)
        if result is not None:
            run.append(key)
    return run


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
