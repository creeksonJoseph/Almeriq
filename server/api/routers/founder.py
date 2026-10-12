"""api/routers/founder.py - Authenticated founder workspace endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from api.dependencies import get_current_user
from schemas.founder import FounderAnalysisRequest, FounderAnalysisResponse
from services.founder import analyze_founder_idea

router = APIRouter(tags=["founder"])


@router.post(
    "/founder/analyze",
    response_model=FounderAnalysisResponse,
    response_model_exclude_none=True,
)
@router.post(
    "/api/founder/analyze",
    response_model=FounderAnalysisResponse,
    response_model_exclude_none=True,
)
async def analyze(
    body: FounderAnalysisRequest,
    current_user: dict = Depends(get_current_user),
) -> FounderAnalysisResponse:
    if current_user.get("role") != "founder":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Founder workspace access requires the founder role.",
        )
    return await analyze_founder_idea(body)
