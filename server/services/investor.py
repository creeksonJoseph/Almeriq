from __future__ import annotations


from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import investor_profile as profile_repo
from repositories import startup_pitch as pitch_repo
from repositories import notification as notification_repo



async def get_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    profile = await profile_repo.get_investor_profile_by_user_id(
        user_id, session=session
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investor profile not found",
        )
    return profile


async def create_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    existing = await profile_repo.get_investor_profile_by_user_id(
        user_id, session=session
    )
    if existing:
        return existing
    return await profile_repo.create_investor_profile(user_id=user_id, session=session)


async def create_startup_pitch(
    founder_id: int,
    title: str,
    session: AsyncSession | None = None,
    summary: str | None = None,
    sector: str | None = None,
    stage: str | None = None,
    ask_amount: float | None = None,
    location: str | None = None,
    target_check_size: float | None = None,
    website_url: str | None = None,
    pitch_deck_url: str | None = None,
    financials_url: str | None = None,
    traction: str | None = None,
    team_summary: str | None = None,
    documents: list[dict] | None = None,
) -> dict:
    if not title or not title.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pitch title is required",
        )
    if ask_amount is not None and ask_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ask_amount cannot be negative",
        )
    return await pitch_repo.create_startup_pitch(
        founder_id=founder_id,
        title=title.strip(),
        summary=summary,
        sector=sector,
        stage=stage,
        ask_amount=ask_amount,
        location=location,
        target_check_size=target_check_size,
        website_url=website_url,
        pitch_deck_url=pitch_deck_url,
        financials_url=financials_url,
        traction=traction,
        team_summary=team_summary,
        documents=documents,
        session=session,
    )


async def list_founder_pitches(
    founder_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    return await pitch_repo.list_startup_pitches(
        founder_id=founder_id, session=session
    )


async def get_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
) -> dict:
    pitch = await pitch_repo.get_startup_pitch(
        pitch_id, founder_id=founder_id, session=session
    )
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )
    return pitch


async def update_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    if "title" in values and values["title"] is not None:
        values["title"] = values["title"].strip()
        if not values["title"]:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Pitch title cannot be empty",
            )
    if values.get("ask_amount") is not None and values["ask_amount"] < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ask_amount cannot be negative",
        )
    pitch = await pitch_repo.update_startup_pitch(
        pitch_id, founder_id, session=session, **values
    )
    if not pitch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )
    return pitch


async def delete_founder_pitch(
    pitch_id: int,
    founder_id: int,
    session: AsyncSession | None = None,
) -> None:
    deleted = await pitch_repo.delete_startup_pitch(
        pitch_id, founder_id, session=session
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup pitch not found",
        )


async def get_investor_pitch(pitch_id: int, session: AsyncSession | None = None) -> dict:
    pitch = await pitch_repo.get_startup_pitch(pitch_id, session=session)
    if not pitch or pitch.get("status") != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    return pitch


async def set_founder_pitch_publication(
    pitch_id: int,
    founder_id: int,
    publish: bool,
    session: AsyncSession | None = None,
) -> dict:
    from datetime import datetime, timezone

    pitch = await pitch_repo.set_startup_pitch_status(
        pitch_id=pitch_id,
        founder_id=founder_id,
        status_value="published" if publish else "draft",
        published_at=datetime.now(timezone.utc) if publish else None,
        session=session,
    )
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    return pitch


def _match_pitch_to_investor(pitch: dict, profile: dict | None) -> tuple[int | None, list[str]]:
    if not profile:
        return None, ["Complete your investor profile to see matching insights."]
    score = 0
    possible = 0
    reasons: list[str] = []
    sectors = [str(value).strip().lower() for value in (profile.get("preferred_sectors") or []) if str(value).strip()]
    if sectors and pitch.get("sector"):
        possible += 35
        if str(pitch["sector"]).lower() in sectors:
            score += 35
            reasons.append(f"Sector match: {pitch['sector']}")
    stages = [str(value).strip().lower() for value in (profile.get("preferred_stages") or []) if str(value).strip()]
    if stages and pitch.get("stage"):
        possible += 30
        if str(pitch["stage"]).lower() in stages:
            score += 30
            reasons.append(f"Stage match: {pitch['stage']}")
    geographies = [str(value).strip().lower() for value in (profile.get("geographies") or []) if str(value).strip()]
    if geographies and pitch.get("location"):
        possible += 15
        location = str(pitch["location"]).lower()
        if any(value in location for value in geographies):
            score += 15
            reasons.append(f"Geography match: {pitch['location']}")
    minimum = profile.get("check_size_min")
    maximum = profile.get("check_size_max")
    ask = pitch.get("target_check_size")
    if (minimum is not None or maximum is not None) and ask is not None:
        possible += 20
        if (minimum is None or float(ask) >= float(minimum)) and (maximum is None or float(ask) <= float(maximum)):
            score += 20
            reasons.append("Target investor check size fits your range")
    if possible == 0:
        return None, ["Add sectors, stages, geography or check-size preferences for a match score."]
    return round(score / possible * 100), reasons or ["No matching criteria found; review the pitch details."]


async def list_all_pitches(
    investor_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> dict:
    # Rank the complete eligible set before slicing. Sorting a single page
    # produces inconsistent results when the best match lives on a later page.
    eligible = await pitch_repo.list_startup_pitches(
        limit=None, offset=0, published_only=True, session=session
    )
    total = len(eligible)
    if investor_id is not None:
        profile = await profile_repo.get_investor_profile_by_user_id(investor_id, session=session)
        for pitch in eligible:
            score, reasons = _match_pitch_to_investor(pitch, profile)
            pitch["match_score"] = score
            pitch["match_reasons"] = reasons
        eligible.sort(
            key=lambda item: item.get("match_score") if item.get("match_score") is not None else -1,
            reverse=True,
        )
    return {"items": eligible[offset : offset + limit], "total": total}


async def upsert_investor_profile(
    user_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    """Create or update the authenticated investor's public profile."""
    existing = await profile_repo.get_investor_profile_by_user_id(user_id, session=session) or {}
    minimum = values.get("check_size_min", existing.get("check_size_min"))
    maximum = values.get("check_size_max", existing.get("check_size_max"))
    if minimum is not None and maximum is not None and float(minimum) > float(maximum):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Minimum check size cannot exceed maximum check size",
        )
    return await profile_repo.upsert_investor_profile(
        user_id=user_id,
        session=session,
        **values,
    )


async def create_investment_request(
    investor_id: int,
    pitch_id: int,
    amount: float | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Create an expression-of-interest record; this does not transfer funds."""
    from repositories import investment as investment_repo

    pitch = await pitch_repo.get_startup_pitch(pitch_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Startup pitch not found")
    if pitch["founder_id"] == investor_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot express interest in your own startup pitch")
    if amount is not None and amount < 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Amount must be non-negative")
    existing = await investment_repo.list_investments(investor_id=investor_id, session=session)
    if any(item["pitch_id"] == pitch_id for item in existing):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You have already contacted this founder about the pitch")
    request = await investment_repo.create_investment(
        investor_id=investor_id, pitch_id=pitch_id, amount=amount, session=session
    )
    if pitch.get("founder_id") != investor_id:
        await notification_repo.create_notification(
            user_id=pitch["founder_id"],
            type="investment",
            title="New investor interest",
            body="An investor has expressed interest in your startup pitch.",
            link="/founder/pitches",
            session=session,
        )
    return request


async def list_investor_requests(investor_id: int, session: AsyncSession | None = None) -> list[dict]:
    from repositories import investment as investment_repo
    items = await investment_repo.list_investments(investor_id=investor_id, session=session)
    for item in items:
        item["pitch"] = await pitch_repo.get_startup_pitch(item["pitch_id"], session=session)
    return items


async def get_investor_request(investment_id: int, investor_id: int, session: AsyncSession | None = None) -> dict:
    from repositories import investment as investment_repo
    item = await investment_repo.get_investment(investment_id, session=session)
    if not item or item["investor_id"] != investor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    item["pitch"] = await pitch_repo.get_startup_pitch(item["pitch_id"], session=session)
    return item


async def update_investor_portfolio(
    investment_id: int,
    investor_id: int,
    values: dict,
    session: AsyncSession | None = None,
) -> dict:
    from repositories import investment as investment_repo
    item = await investment_repo.get_investment(investment_id, session=session)
    if not item or item["investor_id"] != investor_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    if item["status"] not in {"accepted", "in_discussion", "invested"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Record an investment only after the founder accepts or opens discussion")
    if not values.get("payment_method") or not values.get("signature_data"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="A demo payment method and drawn signature are required to confirm this deal record")
    was_invested = item["status"] == "invested"
    updated = await investment_repo.update_investor_portfolio(investment_id, investor_id, values, session=session)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio item not found")
    updated["pitch"] = await pitch_repo.get_startup_pitch(updated["pitch_id"], session=session)
    if not was_invested and updated["pitch"]:
        await notification_repo.create_notification(
            user_id=updated["pitch"]["founder_id"],
            type="investment",
            title="Investor updated their portfolio",
            body="An investor recorded a portfolio entry for your startup. This is an investor-reported record, not a payment confirmation.",
            link="/founder/pitches",
            session=session,
        )
    return updated


async def list_founder_requests(founder_id: int, session: AsyncSession | None = None) -> list[dict]:
    from repositories import investment as investment_repo
    items = await investment_repo.list_investments(founder_id=founder_id, session=session)
    for item in items:
        investor_profile = await profile_repo.get_investor_profile_by_user_id(
            item["investor_id"], session=session
        )
        item["investor_name"] = (
            investor_profile.get("firm_name") if investor_profile else None
        ) or f"Investor #{item['investor_id']}"
        # Only the founder who owns the pitch can reach this response; include
        # the investor's public profile so the pipeline is useful for triage.
        item["investor_profile"] = (
            {
                "investment_focus": investor_profile.get("investment_focus"),
                "check_size": investor_profile.get("check_size"),
                "location": investor_profile.get("location"),
                "about": investor_profile.get("about"),
                "investor_type": investor_profile.get("investor_type"),
                "preferred_sectors": investor_profile.get("preferred_sectors", []),
                "preferred_stages": investor_profile.get("preferred_stages", []),
                "geographies": investor_profile.get("geographies", []),
                "lead_follow_preference": investor_profile.get("lead_follow_preference"),
                "track_record": investor_profile.get("track_record"),
                "value_add": investor_profile.get("value_add"),
                "accreditation_status": investor_profile.get("accreditation_status"),
                "years_investing": investor_profile.get("years_investing"),
                "verification_url": investor_profile.get("verification_url"),
                "notable_investments": investor_profile.get("notable_investments"),
                "companies_backed": investor_profile.get("companies_backed"),
                "exits": investor_profile.get("exits"),
                "assets_under_management": investor_profile.get("assets_under_management"),
                "time_commitment": investor_profile.get("time_commitment"),
                "contact_preference": investor_profile.get("contact_preference"),
                "contact_formats": investor_profile.get("contact_formats", []),
            }
            if investor_profile else None
        )
    return items


async def update_founder_request(
    investment_id: int,
    founder_id: int,
    status_value: str,
    session: AsyncSession | None = None,
) -> dict:
    from repositories import investment as investment_repo
    if status_value not in {"accepted", "declined", "in_discussion"}:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Status must be accepted, declined, or in_discussion")
    item = await investment_repo.get_investment(investment_id, session=session)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    pitch = await pitch_repo.get_startup_pitch(item["pitch_id"], founder_id=founder_id, session=session)
    if not pitch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    if item["status"] != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending investor requests can be updated")
    updated = await investment_repo.update_investment_status(investment_id, status_value, session=session)
    await notification_repo.create_notification(
        user_id=item["investor_id"],
        type="investment",
        title="Founder responded to your interest",
        body=f"Your startup interest request is now {status_value.replace('_', ' ')}.",
        link="/investor/dashboard",
        session=session,
    )
    return updated
