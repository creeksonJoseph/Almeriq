"""repositories/founder_validation.py - CRUD for FounderValidation (idea validation rubric)."""
from __future__ import annotations
from sqlalchemy import select, update
from core.db import async_session_factory
from models.founder_validation import FounderValidation


async def get_validation(user_id: int) -> dict:
    """Return the current validation state, or all-False defaults if none exists yet."""
    async with async_session_factory() as s:
        row = await s.scalar(
            select(FounderValidation).where(FounderValidation.user_id == user_id).limit(1)
        )
        if row:
            return row.to_dict()
        return {
            "dim_problem": False, "dim_solution": False, "dim_market_size": False,
            "dim_demand": False, "dim_competition": False, "dim_feasibility": False,
            "dim_business_model": False, "dim_legal": False, "dim_risk": False,
            "score": 0, "updated_at": None,
        }


async def upsert_validation(user_id: int, dims: dict) -> dict:
    """Create or fully replace the user's validation rubric state."""
    async with async_session_factory() as s:
        existing = await s.scalar(
            select(FounderValidation).where(FounderValidation.user_id == user_id).limit(1)
        )
        if existing:
            for k, v in dims.items():
                if hasattr(existing, k):
                    setattr(existing, k, bool(v))
            await s.commit()
            await s.refresh(existing)
            return existing.to_dict()
        else:
            row = FounderValidation(user_id=user_id, **{k: bool(v) for k, v in dims.items() if k.startswith("dim_")})
            s.add(row)
            await s.commit()
            await s.refresh(row)
            return row.to_dict()
