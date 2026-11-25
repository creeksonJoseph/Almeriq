from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.base import Base
from repositories import user as user_repo
from services import investor as investor_service


@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


async def _user(session: AsyncSession, email: str, role: str) -> int:
    user = await user_repo.create_user(
        email=email,
        hashed_password="test",
        full_name="Portfolio Test",
        role=role,
        session=session,
    )
    await session.flush()
    return user["id"]


@pytest.mark.asyncio
async def test_demo_portfolio_confirmation_is_investor_reported_not_settled(session):
    founder_id = await _user(session, "portfolio-founder@example.com", "FOUNDER")
    investor_id = await _user(session, "portfolio-investor@example.com", "INVESTOR")
    pitch = await investor_service.create_startup_pitch(
        founder_id,
        "Portfolio Test Venture",
        summary="A clear problem and solution.",
        sector="fintech",
        stage="pre-seed",
        location="Nairobi, Kenya",
        session=session,
    )
    await investor_service.publish_founder_pitch(pitch["id"], founder_id, session=session)
    request = await investor_service.create_investment_request(
        investor_id, pitch["id"], session=session
    )
    await investor_service.update_founder_request(
        request["id"], founder_id, "accepted", session=session
    )

    recorded = await investor_service.update_investor_portfolio(
        request["id"],
        investor_id,
        {
            "investment_amount": 25000,
            "payment_method": "mpesa",
            "signature_data": "data:image/png;base64,ZmFrZQ==",
        },
        session=session,
    )

    assert recorded["status"] == "investor_reported"
    assert recorded["investment_amount"] == 25000
    assert recorded["deal_confirmed_at"] is not None
    # The app records an investor-entered demo position; it does not process
    # or independently verify any payment or settlement.
