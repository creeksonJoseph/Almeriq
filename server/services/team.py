from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import conversation as conversation_repo
from repositories import notification as notification_repo
from repositories import team as team_repo
from repositories import user as user_repo


async def discover_talent(
    query: str | None = None,
    role: str | None = None,
    location: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> dict:
    items, total = await team_repo.list_talent(
        query=query, role=role, location=location, limit=limit, offset=offset, session=session
    )
    for item in items:
        reasons = []
        searchable = " ".join([
            item.get("headline") or "",
            item.get("bio") or "",
            " ".join(item.get("skills") or []),
            " ".join((item.get("preferences") or {}).get("desired_roles") or []),
        ]).lower()
        if role and role.lower() in searchable:
            reasons.append(f"Relevant to {role}")
        if location and location.lower() in (item.get("location") or "").lower():
            reasons.append(f"Based in {item.get('location')}")
        if query and query.lower() in searchable:
            reasons.append("Matches your search")
        item["match_reasons"] = reasons
        item["match_score"] = min(100, len(reasons) * 30) if reasons else None
    return {"items": items, "total": total}


async def get_talent_profile(user_id: int, session: AsyncSession | None = None) -> dict:
    profile = await team_repo.get_talent_profile(user_id, session=session)
    if not profile:
        raise HTTPException(status_code=404, detail="Talent profile not found")
    return profile


async def create_invitation(
    founder_id: int,
    invitee_id: int,
    message: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    if founder_id == invitee_id:
        raise HTTPException(status_code=400, detail="You cannot invite yourself")
    profile = await team_repo.get_talent_profile(invitee_id, session=session)
    if not profile:
        raise HTTPException(status_code=404, detail="Active job seeker profile not found")
    if await team_repo.get_membership(founder_id, invitee_id, session=session):
        raise HTTPException(status_code=409, detail="This person is already on your team")

    existing = await team_repo.get_invitation_for_pair(founder_id, invitee_id, session=session)
    if existing:
        if existing["status"] == "pending":
            raise HTTPException(status_code=409, detail="You already have a pending invitation for this person")
        if existing["status"] == "accepted":
            raise HTTPException(status_code=409, detail="This person has already joined your team")
        invitation = await team_repo.update_invitation(existing["id"], "pending", session=session)
        await notification_repo.create_notification(
            user_id=invitee_id, type="team", title="New team invitation",
            body="A founder has invited you to join their team.", link="/job-seeker/invitations", session=session,
        )
        return invitation

    invitation = await team_repo.create_invitation(founder_id, invitee_id, message, session=session)
    await notification_repo.create_notification(
        user_id=invitee_id, type="team", title="New team invitation",
        body="A founder has invited you to join their team.", link="/job-seeker/invitations", session=session,
    )
    return invitation


async def list_invitations(user_id: int, as_founder: bool, session: AsyncSession | None = None) -> list[dict]:
    items = await team_repo.list_invitations(user_id, as_founder, session=session)
    for item in items:
        other_id = item["invitee_id"] if as_founder else item["founder_id"]
        other = await user_repo.get_user_by_id(other_id, session=session)
        item["other_party_name"] = (other or {}).get("full_name") or f"User #{other_id}"
        if as_founder:
            profile = await team_repo.get_talent_profile(item["invitee_id"], session=session)
            item["headline"] = (profile or {}).get("headline")
    return items


async def respond_to_invitation(
    invitation_id: int,
    invitee_id: int,
    status_value: str,
    session: AsyncSession | None = None,
) -> dict:
    if status_value not in {"accepted", "declined"}:
        raise HTTPException(status_code=422, detail="Invitation response must be accepted or declined")
    invitation = await team_repo.get_invitation(invitation_id, session=session)
    if not invitation or invitation["invitee_id"] != invitee_id:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation["status"] != "pending":
        raise HTTPException(status_code=409, detail="This invitation has already been answered")

    updated = await team_repo.update_invitation(invitation_id, status_value, session=session)
    if status_value == "accepted":
        await team_repo.create_membership(
            founder_id=invitation["founder_id"], member_id=invitee_id,
            invitation_id=invitation_id, session=session,
        )
        await conversation_repo.get_or_create_conversation(
            invitation["founder_id"], invitee_id, session=session
        )
    await notification_repo.create_notification(
        user_id=invitation["founder_id"], type="team",
        title="Team invitation response",
        body=f"Your invitation was {status_value}.",
        link="/founder/team", session=session,
    )
    return updated


async def list_members(founder_id: int, session: AsyncSession | None = None) -> list[dict]:
    return await team_repo.list_members(founder_id, session=session)


async def remove_member(founder_id: int, member_id: int, session: AsyncSession | None = None) -> None:
    membership = await team_repo.get_membership(founder_id, member_id, session=session)
    if not membership:
        raise HTTPException(status_code=404, detail="Team member not found")
    removed = await team_repo.delete_membership(founder_id, member_id, session=session)
    if not removed:
        raise HTTPException(status_code=404, detail="Team member not found")
    await notification_repo.create_notification(
        user_id=member_id, type="team", title="Team membership ended",
        body="You are no longer a member of this founder's team.",
        link="/dashboard", session=session,
    )
