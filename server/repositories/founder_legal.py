"""repositories/founder_legal.py - CRUD for FounderLegalFiling records."""
from __future__ import annotations
import logging
from sqlalchemy import select
from core.db import async_session_factory
from models.founder_legal import FounderLegalFiling

logger = logging.getLogger(__name__)


async def create_filing(user_id: int, payload: dict) -> dict:
    filing_type = payload["filing_type"]
    ref = FounderLegalFiling.make_ref(filing_type)
    filing = FounderLegalFiling(
        user_id=user_id,
        filing_type=filing_type,
        ref_number=ref,
        status="Intake submitted",
        company_name=payload.get("company_name"),
        entity_type=payload.get("entity_type"),
        jurisdiction=payload.get("jurisdiction"),
        ip_title=payload.get("ip_title"),
        ip_type=payload.get("ip_type"),
        ip_description=payload.get("ip_description"),
    )
    async with async_session_factory() as s:
        s.add(filing)
        await s.commit()
        await s.refresh(filing)
        logger.info("[LEGAL] Filed %s for user_id=%s ref=%s", filing_type, user_id, ref)
        return filing.to_dict()


async def list_filings(user_id: int) -> list[dict]:
    stmt = (
        select(FounderLegalFiling)
        .where(FounderLegalFiling.user_id == user_id)
        .order_by(FounderLegalFiling.filed_at.desc())
    )
    async with async_session_factory() as s:
        rows = (await s.execute(stmt)).scalars().all()
        return [r.to_dict() for r in rows]
