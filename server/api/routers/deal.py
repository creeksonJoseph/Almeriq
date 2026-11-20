"""api/routers/deal.py - Deal endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user
from repositories import provider_profile as provider_repo
from schemas.provider import DealCreateRequest, DealResponse, DealSignRequest
from services import deal as svc

router = APIRouter(prefix="/api", tags=["deals"])


@router.post("/deals", status_code=status.HTTP_201_CREATED, response_model=DealResponse)
async def create_deal(
    response: Response,
    body: DealCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a deal for an order owned by the authenticated buyer."""
    response.headers["Cache-Control"] = "no-store"
    # A buyer does not need a provider profile. The order already stores the
    # listing's provider_id, so authorization must be based on client_id.
    return await svc.create_deal(
        order_id=body.order_id,
        payment_method=body.payment_method,
        amount=float(body.amount),
        client_id=current_user["id"],
        session=db,
    )


@router.get("/deals/{deal_id}", response_model=DealResponse)
async def get_deal(
    response: Response,
    deal_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a deal for either the order's buyer or its actual provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    profile = await provider_repo.get_provider_profile_by_user_id(current_user["id"], session=db)
    return await svc.get_deal(
        deal_id=deal_id,
        provider_id=profile["id"] if profile else None,
        client_id=current_user["id"],
        session=db,
    )


@router.post("/deals/{deal_id}/sign", response_model=DealResponse)
async def sign_deal(
    response: Response,
    deal_id: int,
    body: DealSignRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Sign a deal for either the order's buyer or its actual provider."""
    response.headers["Cache-Control"] = "no-store"
    profile = await provider_repo.get_provider_profile_by_user_id(current_user["id"], session=db)
    return await svc.sign_deal(
        deal_id=deal_id,
        signature=body.signature,
        payment_method=body.payment_method,
        amount=float(body.amount) if body.amount is not None else None,
        provider_id=profile["id"] if profile else None,
        client_id=current_user["id"],
        session=db,
    )
