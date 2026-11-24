from __future__ import annotations

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session_factory
from models.startup_pitch import StartupPitch


async def create_startup_pitch(
    founder_id: int,
    title: str,
    summary: str | None = None,
    sector: str | None = None,
    stage: str | None = None,
    ask_amount: float | None = None,
    location: str | None = None,
    target_check_size: float | None = None,
    website_url: str | None = None,
    pitch_deck_url: str | None = None,
    financials_url: str | None = None,
    traction: str | None = None,
    team_summary: str | None = None,
    documents: list[dict] | None = None,
    session: AsyncSession | None = None,
) -> dict:
    pitch = StartupPitch(
        founder_id=founder_id,
        title=title,
        summary=summary,
        sector=sector,
        stage=stage,
        ask_amount=ask_amount,
        location=location,
        target_check_size=target_check_size,
        website_url=website_url,
        pitch_deck_url=pitch_deck_url,
        financials_url=financials_url,
        traction=traction,
        team_summary=team_summary,
        documents_json=__import__("json").dumps(documents or []),
    )
    if session is not None:
        session.add(pitch)
        await session.flush()
        return pitch.to_dict()
    async with async_session_factory() as db:
        db.add(pitch)
        await db.commit()
        await db.refresh(pitch)
        return pitch.to_dict()


async def get_startup_pitch(
    pitch_id: int,
    founder_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict | None:
    stmt = select(StartupPitch).where(StartupPitch.id == pitch_id)
    if founder_id is not None:
        stmt = stmt.where(StartupPitch.founder_id == founder_id)
    if session is not None:
        pitch = await session.scalar(stmt)
        return pitch.to_dict() if pitch else None
    async with async_session_factory() as db:
        pitch = await db.scalar(stmt)
        return pitch.to_dict() if pitch else None


async def list_startup_pitches(
    founder_id: int | None = None,
    limit: int | None = None,
    offset: int = 0,
    status: str | None = None,
    session: AsyncSession | None = None,
) -> list[dict]:
    stmt = select(StartupPitch).order_by(StartupPitch.created_at.desc())
    if founder_id is not None:
        stmt = stmt.where(StartupPitch.founder_id == founder_id)
    if status is not None:
        stmt = stmt.where(StartupPitch.status == status)
    if limit is not None:
        stmt = stmt.limit(limit)
    stmt = stmt.offset(offset)
    if session is not None:
        rows = (await session.scalars(stmt)).all()
        return [row.to_dict() for row in rows]
    async with async_session_factory() as db:
        rows = (await db.scalars(stmt)).all()
        return [row.to_dict() for row in rows]


async def count_startup_pitches(
    founder_id: int | None = None,
    status: str | None = None,
    session: AsyncSession | None = None,
) -> int:
    stmt = select(func.count()).select_from(StartupPitch)
    if founder_id is not None:
        stmt = stmt.where(StartupPitch.founder_id == founder_id)
    if status is not None:
        stmt = stmt.where(StartupPitch.status == status)
    if session is not None:
        return await session.scalar(stmt) or 0
    async with async_session_factory() as db:
        return await db.scalar(stmt) or 0


async def update_startup_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict | None:
    allowed = {"title", "summary", "sector", "stage", "ask_amount", "location", "target_check_size", "website_url", "pitch_deck_url", "financials_url", "traction", "team_summary", "documents", "status", "published_at"}
    updates = {("documents_json" if key == "documents" else key): (__import__("json").dumps(value or []) if key == "documents" else value) for key, value in values.items() if key in allowed}
    if not updates:
        return await get_startup_pitch(pitch_id, founder_id, session)
    stmt = (
        update(StartupPitch)
        .where(
            StartupPitch.id == pitch_id,
            StartupPitch.founder_id == founder_id,
        )
        .values(**updates)
        .returning(StartupPitch)
    )
    if session is not None:
        pitch = (await session.execute(stmt)).scalar_one_or_none()
        return pitch.to_dict() if pitch else None
    async with async_session_factory() as db:
        pitch = (await db.execute(stmt)).scalar_one_or_none()
        await db.commit()
        return pitch.to_dict() if pitch else None


async def delete_startup_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
) -> bool:
    stmt = delete(StartupPitch).where(
        StartupPitch.id == pitch_id,
        StartupPitch.founder_id == founder_id,
    )
    if session is not None:
        result = await session.execute(stmt)
        return result.rowcount > 0
    async with async_session_factory() as db:
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount > 0
