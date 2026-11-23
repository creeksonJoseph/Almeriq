"""services/job.py - Business logic for the jobs domain (postings, applications, seeker profiles)."""
from __future__ import annotations
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from repositories import job_posting as job_repo
from repositories import job_application as application_repo
from repositories import job_seeker_profile as seeker_repo
from repositories import provider_profile as provider_repo
from repositories import user as user_repo
from repositories import notification as notification_repo


VALID_STATUSES = {"pending", "reviewed", "accepted", "rejected", "withdrawn"}
VALID_ROLE_TYPES = {"full_time", "part_time", "contract", "freelance", "internship"}


def _owns_posting(posting: dict, *, provider_id: int | None = None, founder_user_id: int | None = None) -> bool:
    if provider_id is not None:
        return posting.get("provider_id") == provider_id and posting.get("founder_user_id") is None
    if founder_user_id is not None:
        return posting.get("founder_user_id") == founder_user_id and posting.get("provider_id") is None
    return False



# ── Job postings ────────────────────────────────────────────────────────────

async def create_job_posting(
    provider_id: int | None,
    title: str,
    description: str,
    location: str | None = None,
    role_type: str | None = None,
    salary_min: float | None = None,
    salary_max: float | None = None,
    requirements: str | None = None,
    is_active: bool = True,
    session: AsyncSession | None = None,
    founder_user_id: int | None = None,
) -> dict:
    """Create a job posting for exactly one authorized owner."""
    if (provider_id is None) == (founder_user_id is None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A job posting must have exactly one owner")
    provider = await provider_repo.get_provider_profile_by_id(provider_id, session=session) if provider_id is not None else True
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found",
        )
    if role_type is not None and role_type not in VALID_ROLE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"role_type must be one of: {', '.join(sorted(VALID_ROLE_TYPES))}",
        )
    if salary_min is not None and salary_max is not None and salary_min > salary_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="salary_min cannot be greater than salary_max",
        )
    return await job_repo.create_job_posting(
        provider_id=provider_id,
        founder_user_id=founder_user_id,
        title=title,
        description=description,
        location=location,
        role_type=role_type,
        salary_min=salary_min,
        salary_max=salary_max,
        requirements=requirements,
        is_active=is_active,
        session=session,
    )


async def get_job_posting(job_id: int, session: AsyncSession | None = None) -> dict:
    """Get a single job posting by id."""
    posting = await job_repo.get_job_posting_by_id(job_id, session=session)
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    return posting


async def list_job_postings(
    is_active: bool | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> dict:
    """List job postings with total count."""
    items = await job_repo.list_job_postings(
        is_active=is_active, limit=limit, offset=offset, session=session
    )
    total = await job_repo.count_job_postings(is_active=is_active, session=session)
    return {"items": items, "total": total}


async def list_my_job_postings(
    *,
    provider_id: int | None = None,
    founder_user_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
    session: AsyncSession | None = None,
) -> dict:
    """List only postings belonging to the authenticated employer."""
    if (provider_id is None) == (founder_user_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A job posting owner is required",
        )
    filters = {
        "provider_id": provider_id,
        "founder_user_id": founder_user_id,
    }
    items = await job_repo.list_job_postings(
        is_active=None, limit=limit, offset=offset, session=session, **filters
    )
    total = await job_repo.count_job_postings(
        is_active=None, session=session, **filters
    )
    return {"items": items, "total": total}


async def update_job_posting(
    job_id: int,
    provider_id: int | None = None,
    founder_user_id: int | None = None,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    """Update a job posting, only if owned by the provider."""
    posting = await job_repo.get_job_posting_by_id(job_id, session=session)
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    if not _owns_posting(posting, provider_id=provider_id, founder_user_id=founder_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not the owner of this job posting",
        )
    if "role_type" in values and values["role_type"] is not None and values["role_type"] not in VALID_ROLE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"role_type must be one of: {', '.join(sorted(VALID_ROLE_TYPES))}",
        )
    if "salary_min" in values or "salary_max" in values:
        salary_min = values.get("salary_min", posting.get("salary_min"))
        salary_max = values.get("salary_max", posting.get("salary_max"))
        if salary_min is not None and salary_max is not None and salary_min > salary_max:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="salary_min cannot be greater than salary_max",
            )
    updated = await job_repo.update_job_posting(job_id, session=session, **values)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    return updated


async def delete_job_posting(job_id: int, provider_id: int | None = None, founder_user_id: int | None = None, session: AsyncSession | None = None) -> None:
    """Delete a job posting, only if owned by the provider."""
    posting = await job_repo.get_job_posting_by_id(job_id, session=session)
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    if not _owns_posting(posting, provider_id=provider_id, founder_user_id=founder_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not the owner of this job posting",
        )
    deleted = await job_repo.delete_job_posting(job_id, session=session)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )


# ── Job applications ────────────────────────────────────────────────────────

async def create_job_application(
    job_posting_id: int,
    applicant_id: int,
    cover_letter: str | None = None,
    resume_url: str | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Apply to a job posting. One application per user per job."""
    posting = await job_repo.get_job_posting_by_id(job_posting_id, session=session)
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    if not posting["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job posting is not active",
        )

    existing = await application_repo.get_application_for_user_on_job(
        job_posting_id, applicant_id, session=session
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job posting",
        )

    application = await application_repo.create_job_application(
        job_posting_id=job_posting_id,
        applicant_id=applicant_id,
        cover_letter=cover_letter,
        resume_url=resume_url,
        session=session,
    )
    employer_user_id = posting.get("founder_user_id")
    if posting.get("provider_id") is not None:
        provider = await provider_repo.get_provider_profile_by_id(posting["provider_id"], session=session)
        employer_user_id = provider.get("user_id") if provider else None
    if employer_user_id is not None and employer_user_id != applicant_id:
        await notification_repo.create_notification(
            user_id=employer_user_id,
            type="job",
            title="New job application",
            body=f"A candidate applied for {posting['title']}.",
            link="/jobs/manage",
            session=session,
        )
    return application


async def get_job_application(
    application_id: int,
    applicant_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Get a single job application by id (optionally scoped to the applicant)."""
    application = await application_repo.get_job_application_by_id(application_id, session=session)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )
    if applicant_id is not None and application["applicant_id"] != applicant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not the owner of this application",
        )
    return application


async def list_applications_for_job(
    job_posting_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all applications for a job posting."""
    posting = await job_repo.get_job_posting_by_id(job_posting_id, session=session)
    if not posting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found",
        )
    applications = await application_repo.get_applications_for_job(job_posting_id, session=session)
    for application in applications:
        applicant = await user_repo.get_user_by_id(application["applicant_id"], session=session)
        profile = await seeker_repo.get_job_seeker_profile_by_user_id(
            application["applicant_id"], session=session
        )
        application["applicant_name"] = (
            applicant.get("full_name") if applicant else None
        ) or f"Applicant #{application['applicant_id']}"
        application["applicant_profile"] = profile
    return applications


async def list_applications_for_applicant(
    applicant_id: int,
    session: AsyncSession | None = None,
) -> list[dict]:
    """List all applications submitted by an applicant."""
    return await application_repo.get_applications_for_applicant(applicant_id, session=session)


async def update_application_status(
    application_id: int,
    status_value: str,
    applicant_id: int | None = None,
    provider_id: int | None = None,
    founder_user_id: int | None = None,
    job_posting_id: int | None = None,
    session: AsyncSession | None = None,
) -> dict:
    """Update an application only by its applicant (withdrawal) or job owner (review)."""
    application = await application_repo.get_job_application_by_id(
        application_id, session=session
    )
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )

    if applicant_id is not None:
        if application["applicant_id"] != applicant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not the owner of this application",
            )
        if status_value != "withdrawn":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Applicants may only withdraw their own applications",
            )
        if application["status"] not in {"pending", "reviewed"}:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending or reviewed applications can be withdrawn",
            )
    elif (provider_id is not None or founder_user_id is not None) and job_posting_id is not None:
        if application["job_posting_id"] != job_posting_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job application not found",
            )
        posting = await job_repo.get_job_posting_by_id(
            job_posting_id, session=session
        )
        if not posting or not _owns_posting(posting, provider_id=provider_id, founder_user_id=founder_user_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not the owner of this job posting",
            )
        allowed_transitions = {
            "pending": {"reviewed", "accepted", "rejected"},
            "reviewed": {"accepted", "rejected"},
        }
        if status_value not in allowed_transitions.get(application["status"], set()):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Application cannot transition from {application['status']} to {status_value}",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Application ownership is required",
        )

    if status_value not in VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"status must be one of: {', '.join(sorted(VALID_STATUSES))}",
        )
    updated = await application_repo.update_application_status(
        application_id, status_value, session=session
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job application not found",
        )
    posting = await job_repo.get_job_posting_by_id(application["job_posting_id"], session=session)
    if applicant_id is not None and posting:
        employer_user_id = posting.get("founder_user_id")
        if posting.get("provider_id") is not None:
            provider = await provider_repo.get_provider_profile_by_id(posting["provider_id"], session=session)
            employer_user_id = provider.get("user_id") if provider else None
        if employer_user_id is not None and employer_user_id != applicant_id:
            await notification_repo.create_notification(
                user_id=employer_user_id,
                type="job",
                title="Application withdrawn",
                body=f"A candidate withdrew their application for {posting['title']}.",
                link="/jobs/manage",
                session=session,
            )
    elif applicant_id is None:
        await notification_repo.create_notification(
            user_id=application["applicant_id"],
            type="job",
            title="Application status updated",
            body=f"Your application status is now {status_value}.",
            link="/job-seeker/dashboard",
            session=session,
        )
    return updated


# ── Job seeker profiles ─────────────────────────────────────────────────────

async def create_or_update_job_seeker_profile(
    user_id: int,
    session: AsyncSession | None = None,
    **values,
) -> dict:
    """Create or update a job seeker profile."""
    return await seeker_repo.create_or_update_job_seeker_profile(
        user_id=user_id,
        session=session,
        **values,
    )

async def get_job_seeker_profile(
    user_id: int,
    session: AsyncSession | None = None,
) -> dict:
    """Get a job seeker profile by user id."""
    profile = await seeker_repo.get_job_seeker_profile_by_user_id(user_id, session=session)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job seeker profile not found",
        )
    return profile
