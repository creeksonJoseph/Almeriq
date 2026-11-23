from __future__ import annotations

from sqlalchemy import and_, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.db import async_session_factory
from models.job_seeker_profile import JobSeekerProfile
from models.team_invitation import TeamInvitation
from models.team_membership import TeamMembership
from models.user import User


async def list_talent(
    query: str | None = None,
    role: str | None = None,
    location: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> tuple[list[dict], int]:
    filters = [JobSeekerProfile.is_active.is_(True)]
    if query:
        term = f"%{query.strip()}%"
        filters.append(or_(
            JobSeekerProfile.headline.ilike(term),
            JobSeekerProfile.bio.ilike(term),
            JobSeekerProfile.skills_json.ilike(term),
            JobSeekerProfile.preferences_json.ilike(term),
            User.full_name.ilike(term),
        ))
    if role:
        term = f"%{role.strip()}%"
        filters.append(or_(
            JobSeekerProfile.headline.ilike(term),
            JobSeekerProfile.skills_json.ilike(term),
            JobSeekerProfile.preferences_json.ilike(term),
        ))
    if location:
        filters.append(JobSeekerProfile.location.ilike(f"%{location.strip()}%"))

    stmt = (
        select(JobSeekerProfile, User.full_name)
        .join(User, User.id == JobSeekerProfile.user_id)
        .where(and_(*filters))
        .order_by(JobSeekerProfile.updated_at.desc())
        .limit(limit)
        .offset(offset)
    )
    count_stmt = (
        select(func.count())
        .select_from(JobSeekerProfile)
        .join(User, User.id == JobSeekerProfile.user_id)
        .where(and_(*filters))
    )

    if session is not None:
        rows = (await session.execute(stmt)).all()
        total = await session.scalar(count_stmt) or 0
    else:
        async with async_session_factory() as db:
            rows = (await db.execute(stmt)).all()
            total = await db.scalar(count_stmt) or 0
    items = []
    for profile, full_name in rows:
        data = profile.to_dict()
        # Resume URLs are intentionally excluded from the public talent directory.
        data.pop("resume_url", None)
        data["full_name"] = full_name or "Job seeker"
        items.append(data)
    return items, total


async def get_talent_profile(user_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = (
        select(JobSeekerProfile, User.full_name)
        .join(User, User.id == JobSeekerProfile.user_id)
        .where(JobSeekerProfile.user_id == user_id, JobSeekerProfile.is_active.is_(True))
    )
    if session is not None:
        row = (await session.execute(stmt)).first()
    else:
        async with async_session_factory() as db:
            row = (await db.execute(stmt)).first()
    if not row:
        return None
    profile, full_name = row
    data = profile.to_dict()
    data.pop("resume_url", None)
    data["full_name"] = full_name or "Job seeker"
    return data


async def get_invitation(invitation_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(TeamInvitation).where(TeamInvitation.id == invitation_id)
    if session is not None:
        item = await session.scalar(stmt)
    else:
        async with async_session_factory() as db:
            item = await db.scalar(stmt)
    return item.to_dict() if item else None


async def get_invitation_for_pair(founder_id: int, invitee_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(TeamInvitation).where(
        TeamInvitation.founder_id == founder_id,
        TeamInvitation.invitee_id == invitee_id,
    )
    if session is not None:
        item = await session.scalar(stmt)
    else:
        async with async_session_factory() as db:
            item = await db.scalar(stmt)
    return item.to_dict() if item else None


async def create_invitation(founder_id: int, invitee_id: int, message: str | None, session: AsyncSession) -> dict:
    item = TeamInvitation(founder_id=founder_id, invitee_id=invitee_id, message=message, status="pending")
    session.add(item)
    await session.flush()
    return item.to_dict()


async def update_invitation(invitation_id: int, status_value: str, session: AsyncSession) -> dict | None:
    item = await session.scalar(select(TeamInvitation).where(TeamInvitation.id == invitation_id))
    if not item:
        return None
    item.status = status_value
    await session.flush()
    return item.to_dict()


async def list_invitations(user_id: int, as_founder: bool, session: AsyncSession | None = None) -> list[dict]:
    column = TeamInvitation.founder_id if as_founder else TeamInvitation.invitee_id
    stmt = select(TeamInvitation).where(column == user_id).order_by(TeamInvitation.created_at.desc())
    if session is not None:
        items = (await session.scalars(stmt)).all()
    else:
        async with async_session_factory() as db:
            items = (await db.scalars(stmt)).all()
    return [item.to_dict() for item in items]


async def create_membership(founder_id: int, member_id: int, invitation_id: int, session: AsyncSession) -> dict:
    item = TeamMembership(founder_id=founder_id, member_id=member_id, invitation_id=invitation_id)
    session.add(item)
    await session.flush()
    return item.to_dict()


async def list_members(founder_id: int, session: AsyncSession | None = None) -> list[dict]:
    stmt = (
        select(TeamMembership, User.full_name, User.email, JobSeekerProfile)
        .join(User, User.id == TeamMembership.member_id)
        .outerjoin(JobSeekerProfile, JobSeekerProfile.user_id == TeamMembership.member_id)
        .where(TeamMembership.founder_id == founder_id)
        .order_by(TeamMembership.created_at.desc())
    )
    if session is not None:
        rows = (await session.execute(stmt)).all()
    else:
        async with async_session_factory() as db:
            rows = (await db.execute(stmt)).all()
    result = []
    for membership, full_name, email, profile in rows:
        item = membership.to_dict()
        item["full_name"] = full_name or "Team member"
        item["email"] = email
        item["headline"] = profile.headline if profile else None
        item["location"] = profile.location if profile else None
        item["skills"] = profile.to_dict()["skills"] if profile else []
        result.append(item)
    return result


async def get_membership(founder_id: int, member_id: int, session: AsyncSession | None = None) -> dict | None:
    stmt = select(TeamMembership).where(
        TeamMembership.founder_id == founder_id,
        TeamMembership.member_id == member_id,
    )
    if session is not None:
        item = await session.scalar(stmt)
    else:
        async with async_session_factory() as db:
            item = await db.scalar(stmt)
    return item.to_dict() if item else None


async def delete_membership(founder_id: int, member_id: int, session: AsyncSession) -> bool:
    result = await session.execute(delete(TeamMembership).where(
        TeamMembership.founder_id == founder_id,
        TeamMembership.member_id == member_id,
    ))
    return result.rowcount > 0
