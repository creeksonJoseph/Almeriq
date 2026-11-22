"""services/deal.py - Business logic for deals."""
from __future__ import annotations
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from repositories import deal as deal_repo
from repositories import order as order_repo
from repositories import asset as asset_repo
from repositories import provider_profile as provider_repo
from repositories import notification as notification_repo



async def _get_participant_order(order_id: int, provider_id: int | None, client_id: int | None, session: AsyncSession | None) -> dict | None:
    if provider_id is not None:
        order = await order_repo.get_order_by_id(order_id, provider_id=provider_id, session=session)
        if order:
            return order
    if client_id is not None:
        return await order_repo.get_order_by_id(order_id, client_id=client_id, session=session)
    return None


async def create_deal(
    order_id: int,
    payment_method: str,
    amount: float,
    provider_id: int | None = None,
    client_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create a deal for an order owned by the authenticated buyer or provider."""
    order = await _get_participant_order(order_id, provider_id, client_id, session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    if payment_method not in {"visa", "mastercard", "paypal", "mpesa"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported simulated payment method.",
        )
    if amount <= 0 or round(float(amount), 2) != round(float(order.get("lease_amount") or 0), 2):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Deal amount must match the marketplace order price.",
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
    order = await _get_participant_order(deal["order_id"], provider_id, client_id, session)
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
    order = await _get_participant_order(deal["order_id"], provider_id, client_id, session)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    if deal.get("signature"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This demo deal has already been signed.",
        )
    if amount is not None and round(float(amount), 2) != round(float(deal.get("amount") or 0), 2):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The deal amount is fixed by the marketplace listing and cannot be changed.",
        )
    if payment_method is not None and payment_method not in {"visa", "mastercard", "paypal", "mpesa"}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported simulated payment method.",
        )
    updated = await deal_repo.sign_deal(
        deal_id, signature, payment_method=payment_method, amount=None, session=session
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )
    recipient_id = order["client_id"]
    if client_id is not None and order["client_id"] == client_id:
        provider = await provider_repo.get_provider_profile_by_id(order["provider_id"], session=session)
        recipient_id = provider.get("user_id") if provider else None
    if recipient_id is not None:
        await notification_repo.create_notification(
            user_id=recipient_id,
            type="order",
            title="Marketplace deal signed",
            body=f"Deal #{deal_id} has been signed in the demo checkout.",
            link=f"/provider/orders/{order['id']}" if recipient_id != order["client_id"] else "/founder/orders",
            session=session,
        )
    return updated
