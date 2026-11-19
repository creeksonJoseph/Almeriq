from __future__ import annotations
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.startup_pitch import StartupPitch

async def create_startup_pitch(founder_id: int, title: str, session: AsyncSession | None = None) -> dict:
    pitch = StartupPitch(founder_id=founder_id, title=title)
    if session is not None:
        session.add(pitch); await session.flush(); return pitch.to_dict()
    async with async_session_factory() as s:
        s.add(pitch); await s.commit(); await s.refresh(pitch); return pitch.to_dict()

async def list_startup_pitches(session: AsyncSession | None = None) -> list[dict]:
    stmt = select(StartupPitch)
    if session is not None:
        res = await session.scalars(stmt); return [p.to_dict() for p in res]
    async with async_session_factory() as s:
        res = await s.scalars(stmt); return [p.to_dict() for p in res]
