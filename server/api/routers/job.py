"""api/routers/job.py - Jobs domain endpoints (postings, applications, seeker profiles)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from api.dependencies import get_current_user, get_current_job_owner
from schemas.job import (
    JobApplicationCreateRequest,
    JobApplicationListResponse,
    JobApplicationResponse,
    JobApplicationUpdateRequest,
    JobPostingCreateRequest,
    JobPostingListResponse,
    JobPostingResponse,
    JobPostingUpdateRequest,
    JobSeekerProfileCreateRequest,
    JobSeekerProfileResponse,
    JobSeekerProfileUpdateRequest,
)
from services import job as svc

router = APIRouter(prefix="/api", tags=["jobs"])

def _require_job_seeker(current_user: dict) -> int:
    if str(current_user.get("role", "")).lower() != "job_seeker":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Job seeker account required")
    return int(current_user["id"])



# ── Job postings (public read, provider write) ──────────────────────────────

@router.get("/jobs", response_model=JobPostingListResponse)
async def list_jobs(
    response: Response,
    db: AsyncSession = Depends(get_db),
    is_active: bool | None = Query(default=True),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List job postings, newest first. Public read."""
    response.headers["Cache-Control"] = "public, max-age=30"
    return await svc.list_job_postings(
        is_active=is_active,
        limit=limit,
        offset=offset,
        session=db,
    )


@router.get("/jobs/mine", response_model=JobPostingListResponse)
async def list_my_jobs(
    response: Response,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    """List job postings owned by the authenticated founder or provider."""
    response.headers["Cache-Control"] = "private, no-store"
    return await svc.list_my_job_postings(
        **owner, limit=limit, offset=offset, session=db
    )


@router.get("/jobs/{job_id}", response_model=JobPostingResponse)
async def get_job(
    response: Response,
    job_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve a single job posting."""
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_job_posting(job_id=job_id, session=db)


@router.post("/jobs", status_code=status.HTTP_201_CREATED, response_model=JobPostingResponse)
async def create_job(
    response: Response,
    body: JobPostingCreateRequest,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create a new job posting for the current provider."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_job_posting(
        **owner,
        session=db,
        **body.model_dump(),
    )


@router.put("/jobs/{job_id}", response_model=JobPostingResponse)
async def update_job(
    response: Response,
    job_id: int,
    body: JobPostingUpdateRequest,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Update a job posting owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    data = body.model_dump(exclude_unset=True)
    return await svc.update_job_posting(
        job_id=job_id,
        **owner,
        session=db,
        **data,
    )


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    response: Response,
    job_id: int,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a job posting owned by the current provider."""
    response.headers["Cache-Control"] = "no-store"
    await svc.delete_job_posting(job_id=job_id, **owner, session=db)


# ── Job applications ────────────────────────────────────────────────────────

@router.post("/jobs/{job_id}/apply", status_code=status.HTTP_201_CREATED, response_model=JobApplicationResponse)
async def apply_to_job(
    response: Response,
    job_id: int,
    body: JobApplicationCreateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Apply to a job posting (one application per user per job)."""
    applicant_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "no-store"
    return await svc.create_job_application(
        job_posting_id=job_id,
        applicant_id=applicant_id,
        cover_letter=body.cover_letter,
        resume_url=body.resume_url,
        session=db,
    )


@router.get("/job-seeker/applications", response_model=JobApplicationListResponse)
async def list_my_applications(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List applications submitted by the current user."""
    applicant_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "private, max-age=30"
    items = await svc.list_applications_for_applicant(
        applicant_id=applicant_id, session=db
    )
    return {"items": items, "total": len(items)}


@router.get("/job-seeker/applications/{application_id}", response_model=JobApplicationResponse)
async def get_my_application(
    response: Response,
    application_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve one of the current user's applications."""
    applicant_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_job_application(
        application_id=application_id,
        applicant_id=applicant_id,
        session=db,
    )


@router.put("/job-seeker/applications/{application_id}", response_model=JobApplicationResponse)
async def update_my_application(
    response: Response,
    application_id: int,
    body: JobApplicationUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Allow an applicant to withdraw their own application."""
    applicant_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "no-store"
    return await svc.update_application_status(
        application_id=application_id,
        applicant_id=current_user["id"],
        status_value=body.status,
        session=db,
    )


@router.get("/jobs/{job_id}/applications", response_model=JobApplicationListResponse)
async def list_job_applications(
    response: Response,
    job_id: int,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """List applications for a job owned by the authenticated provider."""
    response.headers["Cache-Control"] = "private, max-age=30"
    posting = await svc.get_job_posting(job_id=job_id, session=db)
    if posting["provider_id"] != owner["provider_id"] or posting["founder_user_id"] != owner["founder_user_id"]:
        # Exactly one owner column is populated; comparing both values is intentional.
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not the owner of this job posting")
    items = await svc.list_applications_for_job(job_posting_id=job_id, session=db)
    return {"items": items, "total": len(items)}


@router.patch(
    "/jobs/{job_id}/applications/{application_id}",
    response_model=JobApplicationResponse,
)
async def review_job_application(
    response: Response,
    job_id: int,
    application_id: int,
    body: JobApplicationUpdateRequest,
    owner: dict = Depends(get_current_job_owner),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Allow the owner of a job posting to review its applications."""
    response.headers["Cache-Control"] = "no-store"
    return await svc.update_application_status(
        application_id=application_id,
        job_posting_id=job_id,
        **owner,
        status_value=body.status,
        session=db,
    )


# ── Job seeker profile ──────────────────────────────────────────────────────

@router.get("/job-seeker/profile", response_model=JobSeekerProfileResponse)
async def get_seeker_profile(
    response: Response,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Retrieve the current user's job seeker profile."""
    user_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "private, max-age=30"
    return await svc.get_job_seeker_profile(user_id=user_id, session=db)


@router.put("/job-seeker/profile", response_model=JobSeekerProfileResponse)
async def create_or_update_seeker_profile(
    response: Response,
    body: JobSeekerProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create or update the current user's job seeker profile."""
    user_id = _require_job_seeker(current_user)
    response.headers["Cache-Control"] = "no-store"
    data = body.model_dump(exclude_unset=True)
    return await svc.create_or_update_job_seeker_profile(
        user_id=user_id,
        session=db,
        **data,
    )
