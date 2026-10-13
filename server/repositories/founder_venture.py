"""repositories/founder_venture.py - CRUD for FounderVenture records."""
from __future__ import annotations
import json
import logging
from sqlalchemy import select
from core.db import async_session_factory
from models.founder_venture import FounderVenture

logger = logging.getLogger(__name__)


async def save_venture(
    user_id: int,
    brief: dict,
    analysis: dict,
) -> dict:
    """Persist a venture brief + analysis result for a founder."""
    venture = FounderVenture(
        user_id=user_id,
        idea=brief["idea"],
        problem=brief["problem"],
        solution=brief["solution"],
        customer=brief["customer"],
        location=brief["location"],
        source=analysis.get("source", "local"),
        summary=analysis["summary"],
        market=analysis["market"],
        risks_json=json.dumps(analysis.get("risks", [])),
        mvp_json=json.dumps(analysis.get("mvp", [])),
        roadmap_json=json.dumps(analysis.get("roadmap", [])),
        next_steps_json=json.dumps(analysis.get("next_steps", [])),
    )
    async with async_session_factory() as s:
        s.add(venture)
        await s.commit()
        await s.refresh(venture)
        logger.info("[VENTURE] Saved venture id=%s for user_id=%s", venture.id, user_id)
        return venture.to_dict()


async def list_ventures(user_id: int, limit: int = 50) -> list[dict]:
    """Return all ventures for a user, newest first."""
    stmt = (
        select(FounderVenture)
        .where(FounderVenture.user_id == user_id)
        .order_by(FounderVenture.created_at.desc())
        .limit(limit)
    )
    async with async_session_factory() as s:
        rows = (await s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]


async def get_venture(venture_id: int, user_id: int) -> dict | None:
    """Return a single venture, only if it belongs to the requesting user."""
    stmt = (
        select(FounderVenture)
        .where(FounderVenture.id == venture_id, FounderVenture.user_id == user_id)
        .limit(1)
    )
    async with async_session_factory() as s:
        row = await s.scalar(stmt)
        return row.to_dict() if row else None


async def delete_venture(venture_id: int, user_id: int) -> bool:
    """Delete a venture, returns True if it existed and was deleted."""
    from sqlalchemy import delete as sql_delete
    stmt = (
        sql_delete(FounderVenture)
        .where(FounderVenture.id == venture_id, FounderVenture.user_id == user_id)
    )
    async with async_session_factory() as s:
        result = await s.execute(stmt)
        await s.commit()
        return result.rowcount > 0
