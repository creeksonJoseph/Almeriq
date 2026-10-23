"""repositories/company_guide.py - SQLAlchemy 2.0 repository for CompanyRegistrationGuide."""
from __future__ import annotations

import json
import logging
from typing import Any, Optional
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session_factory
from models.company_guide import CompanyRegistrationGuide

logger = logging.getLogger(__name__)


async def get_guide_by_country(
    country: str,
    session: Optional[AsyncSession] = None,
) -> Optional[dict[str, Any]]:
    """Fetch cached company registration guide by country (case-insensitive normalized)."""
    norm = country.strip().lower()
    stmt = select(CompanyRegistrationGuide).where(
        func.lower(CompanyRegistrationGuide.country) == norm
    ).limit(1)

    if session is not None:
        row = await session.scalar(stmt)
        return row.to_dict() if row else None

    async with async_session_factory() as s:
        row = await s.scalar(stmt)
        return row.to_dict() if row else None


async def save_guide(
    guide_data: dict[str, Any],
    session: Optional[AsyncSession] = None,
) -> dict[str, Any]:
    """Insert or update a company registration guide for a country."""
    norm = guide_data["country"].strip().lower()
    country_name = guide_data.get("country_name") or guide_data["country"].title()

    prerequisites_json = (
        json.dumps(guide_data.get("prerequisites", []))
        if isinstance(guide_data.get("prerequisites"), list)
        else guide_data.get("prerequisites_json")
    )
    steps_json = (
        json.dumps(guide_data.get("steps", []))
        if isinstance(guide_data.get("steps"), list)
        else guide_data.get("steps_json", "[]")
    )
    common_pitfalls_json = (
        json.dumps(guide_data.get("common_pitfalls", []))
        if isinstance(guide_data.get("common_pitfalls"), list)
        else guide_data.get("common_pitfalls_json")
    )
    post_registration_json = (
        json.dumps(guide_data.get("post_registration", []))
        if isinstance(guide_data.get("post_registration"), list)
        else guide_data.get("post_registration_json")
    )

    async def _execute(s: AsyncSession) -> dict[str, Any]:
        stmt = select(CompanyRegistrationGuide).where(
            func.lower(CompanyRegistrationGuide.country) == norm
        ).limit(1)
        existing = await s.scalar(stmt)

        if existing:
            existing.country_name = country_name
            existing.regulatory_body = guide_data.get("regulatory_body")
            existing.portal_url = guide_data.get("portal_url")
            existing.estimated_timeline = guide_data.get("estimated_timeline")
            existing.estimated_cost = guide_data.get("estimated_cost")
            existing.prerequisites_json = prerequisites_json
            existing.steps_json = steps_json
            existing.common_pitfalls_json = common_pitfalls_json
            existing.post_registration_json = post_registration_json
            existing.source = guide_data.get("source", "ai")
            await s.commit()
            await s.refresh(existing)
            return existing.to_dict()

        new_guide = CompanyRegistrationGuide(
            country=norm,
            country_name=country_name,
            regulatory_body=guide_data.get("regulatory_body"),
            portal_url=guide_data.get("portal_url"),
            estimated_timeline=guide_data.get("estimated_timeline"),
            estimated_cost=guide_data.get("estimated_cost"),
            prerequisites_json=prerequisites_json,
            steps_json=steps_json,
            common_pitfalls_json=common_pitfalls_json,
            post_registration_json=post_registration_json,
            source=guide_data.get("source", "ai"),
        )
        s.add(new_guide)
        await s.commit()
        await s.refresh(new_guide)
        return new_guide.to_dict()

    if session is not None:
        return await _execute(session)

    async with async_session_factory() as s:
        return await _execute(s)
