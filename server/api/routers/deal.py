"""api/routers/deal.py - Deal endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_provider_profile
from schemas.provider import DealCreateRequest, DealResponse, DealSignRequest
from services import deal as svc

router = APIRouter(prefix="/api", tags=["deals"])


@router.post("/deals", status_code=status.HTTP_201_CREATED, response_model=DealResponse)
async def create_deal(
    response: Response,
    body: DealCreateRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a deal for an order owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_deal(
        order_id=body.order_id,
        payment_method=body.payment_method,
        amount=float(body.amount),
        provider_id=profile["id"],
        session=db,
    )


@router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(
    response: Response,
    deal_id: int,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a deal whose order belongs to the current provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_deal(deal_id=deal_id, provider_id=profile["id"], session=db)


@router.post("/deals/{deal_id}/sign", response_model=DealResponse)
async def sign_deal(
    response: Response,
    deal_id: int,
    body: DealSignRequest,
    profile: dict = Depends(get_current_provider_profile),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Sign a deal whose order belongs to the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.sign_deal(
        deal_id=deal_id,
        signature=body.signature,
        provider_id=profile["id"],
        session=db,
    )
