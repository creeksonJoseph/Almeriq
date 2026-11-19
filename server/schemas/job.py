"""schemas/job.py - Pydantic models for the jobs domain."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ── Job posting schemas ────────────────────────────────────────────────────

class JobPostingBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., min_length=1)
    location: Optional[str] = Field(default=None, max_length=200)
    role_type: Optional[str] = Field(default=None, max_length=30)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    requirements: Optional[str] = None
    is_active: bool = True

    @field_validator("role_type", mode="before")
    @classmethod
    def validate_role_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("full_time", "part_time", "contract", "freelance", "internship"):
            raise ValueError("role_type must be one of: full_time, part_time, contract, freelance, internship")
        return v

    @field_validator("salary_max", mode="before")
    @classmethod
    def validate_salary_max(cls, v, info):
        if v is not None and info.data.get("salary_min") is not None and v < info.data["salary_min"]:
            raise ValueError("salary_max cannot be less than salary_min")
        return v


class JobPostingCreateRequest(JobPostingBase):
    pass


class JobPostingUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, min_length=1)
    location: Optional[str] = Field(default=None, max_length=200)
    role_type: Optional[str] = Field(default=None, max_length=30)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    requirements: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("role_type", mode="before")
    @classmethod
    def validate_role_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("full_time", "part_time", "contract", "freelance", "internship"):
            raise ValueError("role_type must be one of: full_time, part_time, contract, freelance, internship")
        return v


class JobPostingResponse(JobPostingBase):
    id: int
    provider_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobPostingListResponse(BaseModel):
    items: List[JobPostingResponse]
    total: int


# ── Job application schemas ────────────────────────────────────────────────

class JobApplicationBase(BaseModel):
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = Field(default=None, max_length=500)


class JobApplicationCreateRequest(JobApplicationBase):
    pass


class JobApplicationUpdateRequest(BaseModel):
    status: str = Field(..., max_length=30)

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {"pending", "reviewed", "accepted", "rejected", "withdrawn"}
        if v not in valid_statuses:
            raise ValueError(f"status must be one of: {', '.join(sorted(valid_statuses))}")
        return v


class JobApplicationResponse(JobApplicationBase):
    id: int
    job_posting_id: int
    applicant_id: int
    status: str
    applied_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobApplicationListResponse(BaseModel):
    items: List[JobApplicationResponse]
    total: int


# ── Job seeker profile schemas ─────────────────────────────────────────────

class JobSeekerProfileBase(BaseModel):
    headline: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = None
    location: Optional[str] = Field(default=None, max_length=200)
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = Field(default=None, ge=0)
    resume_url: Optional[str] = Field(default=None, max_length=500)
    portfolio_url: Optional[str] = Field(default=None, max_length=500)
    is_active: bool = True


class JobSeekerProfileCreateRequest(JobSeekerProfileBase):
    pass


class JobSeekerProfileUpdateRequest(JobSeekerProfileBase):
    pass


class JobSeekerProfileResponse(JobSeekerProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
