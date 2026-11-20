"""services/deal.py - Business logic for deals."""
from __future__ import annotations
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import deal as deal_repo
from repositories import order as order_repo
from repositories import asset as asset_repo
from repositories import provider_profile as provider_repo

logger = logging.getLogger(__name__)


async def create_deal(
    order_id: int,
    payment_method: str,
    amount: float,
    provider_id: int | None = None,
    client_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a deal for an order owned by the authenticated buyer or provider."""
    order = await order_repo.get_order_by_id(order_id, provider_id=provider_id, client_id=client_id, session=session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    existing = await deal_repo.get_deal_by_order_id(order_id, session=session)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A deal already exists for this order",
        )
    return await deal_repo.create_deal(
        order_id=order_id,
        payment_method=payment_method,
        amount=amount,
        session=session,
    )


async def get_deal(
    deal_id: int,
    provider_id: int | None = None,
    client_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Get a deal by ID, ensuring the linked order belongs to the buyer or provider."""
    deal = await deal_repo.get_deal_by_id(deal_id, session=session)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    order = await order_repo.get_order_by_id(deal["order_id"], provider_id=provider_id, client_id=client_id, session=session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    provider = await provider_repo.get_provider_profile_by_id(order["provider_id"], session=session)
    asset = await asset_repo.get_asset_by_id(order["asset_id"], session=session)
    deal["provider_name"] = (provider or {}).get("company_name") or (provider or {}).get("trading_name")
    deal["asset_name"] = (asset or {}).get("name")
    return deal


async def sign_deal(
    deal_id: int,
    signature: str,
    payment_method: str | None = None,
    amount: float | None = None,
    provider_id: int | None = None,
    client_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Sign a deal, ensuring the linked order belongs to the buyer or provider."""
    deal = await deal_repo.get_deal_by_id(deal_id, session=session)
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    order = await order_repo.get_order_by_id(deal["order_id"], provider_id=provider_id, client_id=client_id, session=session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    updated = await deal_repo.sign_deal(deal_id, signature, payment_method=payment_method, amount=amount, session=session)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    return updated
