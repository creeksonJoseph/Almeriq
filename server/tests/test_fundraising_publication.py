from __future__ import annotations

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from models import Base, InvestorUpdate, Investment, StartupPitch
from repositories import startup_pitch as pitch_repo
from repositories import investor_update as update_repo


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
