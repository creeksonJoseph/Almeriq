from __future__ import annotations
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import async_session_factory
from models.advisory_request import AdvisoryRequest


async def create_advisory_request(founder_id: int, expert_id: int, subject: str, description: str, budget: float | None = None, session: AsyncSession | None = None) -> dict:
    item = AdvisoryRequest(founder_id=founder_id, expert_id=expert_id, subject=subject, description=description, budget=budget, status="pending")
    if session is not None:
        session.add(item)
        await session.flush()
        return item.to_dict()
    async with async_session_factory() as db:
        db.add(item)
        await db.commit()
        await db.refresh(item)
        return item.to_dict()


async def list_advisory_requests(user_id: int, role: str, session: AsyncSession | None = None) -> list[dict]:
    field = AdvisoryRequest.expert_id if role == "expert" else AdvisoryRequest.founder_id
    stmt = select(AdvisoryRequest).where(field == user_id).order_by(AdvisoryRequest.created_at.desc())
    if session is not None:
        rows = (await session.scalars(stmt)).all()
        return [row.to_dict() for row in rows]
    async with async_session_factory() as db:
        rows = (await db.scalars(stmt)).all()
        return [row.to_dict() for row in rows]


async def get_advisory_request(request_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(AdvisoryRequest).where(AdvisoryRequest.id == request_id)
    if session is not None:
        item = await session.scalar(stmt)
        return item.to_dict() if item else None
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        return item.to_dict() if item else None


async def update_advisory_request_status(request_id: int, status_value: str, session: AsyncSession | None = None) -> dict | None:
    stmt = select(AdvisoryRequest).where(AdvisoryRequest.id == request_id)
    if session is not None:
        item = await session.scalar(stmt)
        if item is None:
            return None
        item.status = status_value
        await session.flush()
        return item.to_dict()
    async with async_session_factory() as db:
        item = await db.scalar(stmt)
        if item is None:
            return None
        item.status = status_value
        await db.commit()
        await db.refresh(item)
        return item.to_dict()
