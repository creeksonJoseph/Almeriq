from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models import Base, InvestorUpdate, Investment, StartupPitch
from repositories import startup_pitch as pitch_repo
from repositories import investor_update as update_repo
from services import investor as investor_service
from fastapi import HTTPException


@pytest.fixture
async def db_session():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_pitch_discovery_excludes_drafts_and_counts_published_only(db_session):
    draft = StartupPitch(founder_id=10, title="Draft startup")
    published = StartupPitch(founder_id=11, title="Published startup", status="published")
    db_session.add_all([draft, published])
    await db_session.flush()

    visible = await pitch_repo.list_startup_pitches(
        limit=50, offset=0, published_only=True, session=db_session
    )
    total = await pitch_repo.count_startup_pitches(
        published_only=True, session=db_session
    )

    assert [item["title"] for item in visible] == ["Published startup"]
    assert total == 1


@pytest.mark.asyncio
async def test_founder_can_publish_and_unpublish_only_owned_pitch(db_session):
    pitch = StartupPitch(founder_id=20, title="My startup")
    db_session.add(pitch)
    await db_session.flush()

    published = await pitch_repo.set_startup_pitch_status(
        pitch.id, 20, "published", None, session=db_session
    )
    assert published["status"] == "published"

    not_owned = await pitch_repo.set_startup_pitch_status(
        pitch.id, 21, "draft", None, session=db_session
    )
    assert not_owned is None

    unpublished = await pitch_repo.set_startup_pitch_status(
        pitch.id, 20, "draft", None, session=db_session
    )
    assert unpublished["status"] == "draft"


@pytest.mark.asyncio
async def test_investor_only_receives_published_updates_for_interested_pitches(db_session):
    pitch = StartupPitch(founder_id=30, title="Interested startup", status="published")
    other_pitch = StartupPitch(founder_id=31, title="Other startup", status="published")
    db_session.add_all([pitch, other_pitch])
    await db_session.flush()

    db_session.add_all([
        Investment(investor_id=40, pitch_id=pitch.id, status="accepted"),
        Investment(investor_id=41, pitch_id=other_pitch.id, status="accepted"),
    ])
    db_session.add_all([
        InvestorUpdate(founder_id=30, pitch_id=pitch.id, period="November", content="A meaningful update", status="published"),
        InvestorUpdate(founder_id=30, pitch_id=pitch.id, period="December", content="A private draft", status="draft"),
    ])
    await db_session.flush()

    updates = await update_repo.list_investor_updates(40, db_session)

    assert len(updates) == 1
    assert updates[0]["pitch_title"] == "Interested startup"
    assert updates[0]["period"] == "November"


@pytest.mark.asyncio
async def test_investors_cannot_open_or_contact_a_draft_pitch(db_session):
    draft = StartupPitch(founder_id=50, title="Private draft")
    db_session.add(draft)
    await db_session.flush()

    with pytest.raises(HTTPException) as view_error:
        await investor_service.get_investor_pitch(draft.id, session=db_session)
    assert view_error.value.status_code == 404

    with pytest.raises(HTTPException) as interest_error:
        await investor_service.create_investment_request(
            investor_id=60, pitch_id=draft.id, session=db_session
        )
    assert interest_error.value.status_code == 404


@pytest.mark.asyncio
async def test_investor_matching_paginates_after_global_ranking(db_session):
    # The second-created pitch is the stronger match. It must appear first
    # even when the requested page size is one.
    from models import InvestorProfile

    db_session.add(InvestorProfile(
        user_id=70,
        preferred_sectors_json='["climate"]',
        preferred_stages_json='["seed"]',
        geographies_json='["kenya"]',
    ))
    db_session.add_all([
        StartupPitch(founder_id=71, title="Weak match", sector="Retail", stage="Pre-seed", location="Ghana", status="published"),
        StartupPitch(founder_id=72, title="Strong match", sector="Climate", stage="Seed", location="Kenya", status="published"),
    ])
    await db_session.flush()

    result = await investor_service.list_all_pitches(
        investor_id=70, limit=1, offset=0, session=db_session
    )

    assert result["total"] == 2
    assert result["items"][0]["title"] == "Strong match"
    assert result["items"][0]["match_score"] == 100
