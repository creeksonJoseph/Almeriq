"""schemas/job.py - Pydantic models for the jobs domain."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator


# ── Job posting schemas ────────────────────────────────────────────────────

class JobPostingBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    location: Optional[str] = Field(default=None, max_length=200)
    role_type: Optional[str] = Field(default=None, max_length=30)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    requirements: Optional[str] = None
    is_active: bool = True

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        if value is not None and isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("This field cannot be blank")
        return value

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
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, min_length=1)
    location: Optional[str] = Field(default=None, max_length=200)
    role_type: Optional[str] = Field(default=None, max_length=30)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    requirements: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_optional_text(cls, value):
        if value is not None and isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("This field cannot be blank")
        return value

    @field_validator("role_type", mode="before")
    @classmethod
    def validate_role_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("full_time", "part_time", "contract", "freelance", "internship"):
            raise ValueError("role_type must be one of: full_time, part_time, contract, freelance, internship")
        return v


class JobPostingResponse(JobPostingBase):
    id: int
    provider_id: Optional[int] = None
    founder_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JobPostingListResponse(BaseModel):
    items: List[JobPostingResponse]
    total: int


# ── Job application schemas ────────────────────────────────────────────────

class JobApplicationBase(BaseModel):
    cover_letter: Optional[str] = Field(default=None, max_length=5000)
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
    applicant_name: Optional[str] = None
    applicant_profile: Optional[dict] = None
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

class WorkExperienceEntry(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200)
    company: Optional[str] = Field(default=None, max_length=200)
    start_date: Optional[str] = Field(default=None, max_length=40)
    end_date: Optional[str] = Field(default=None, max_length=40)
    description: Optional[str] = Field(default=None, max_length=3000)


class EducationEntry(BaseModel):
    qualification: Optional[str] = Field(default=None, max_length=200)
    institution: Optional[str] = Field(default=None, max_length=200)
    year: Optional[str] = Field(default=None, max_length=40)
    details: Optional[str] = Field(default=None, max_length=2000)


class CertificationEntry(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    issuer: Optional[str] = Field(default=None, max_length=200)
    year: Optional[str] = Field(default=None, max_length=40)
    url: Optional[str] = Field(default=None, max_length=500)


class ProjectEntry(BaseModel):
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=3000)
    url: Optional[str] = Field(default=None, max_length=500)
    technologies: Optional[str] = Field(default=None, max_length=500)


class JobSeekerPreferences(BaseModel):
    desired_roles: List[str] = Field(default_factory=list, max_length=30)
    job_types: List[Literal["full_time", "part_time", "contract", "freelance", "internship"]] = Field(default_factory=list, max_length=5)
    location: Optional[str] = Field(default=None, max_length=200)
    salary_min: Optional[float] = Field(default=None, ge=0)
    salary_max: Optional[float] = Field(default=None, ge=0)
    remote_only: bool = False

    @field_validator("salary_max")
    @classmethod
    def salary_range_is_valid(cls, value, info):
        minimum = info.data.get("salary_min")
        if value is not None and minimum is not None and value < minimum:
            raise ValueError("salary_max cannot be less than salary_min")
        return value


class JobSeekerProfileBase(BaseModel):
    headline: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=5000)
    location: Optional[str] = Field(default=None, max_length=200)
    skills: Optional[List[str]] = Field(default=None, max_length=100)
    experience_years: Optional[int] = Field(default=None, ge=0, le=80)
    resume_url: Optional[str] = Field(default=None, max_length=500)
    portfolio_url: Optional[str] = Field(default=None, max_length=500)
    experience: Optional[List[WorkExperienceEntry]] = Field(default=None, max_length=50)
    education: Optional[List[EducationEntry]] = Field(default=None, max_length=30)
    certifications: Optional[List[CertificationEntry]] = Field(default=None, max_length=50)
    projects: Optional[List[ProjectEntry]] = Field(default=None, max_length=50)
    preferences: Optional[JobSeekerPreferences] = None
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
