"""schemas/waitlist.py - request + response validation models. No DB logic here."""
from __future__ import annotations
from pydantic import BaseModel, EmailStr, field_validator


VALID_ROLES = {
    "Founder",
    "Investor",
    "Job Seeker",
    "Infrastructure Provider",
}


class WaitlistJoinRequest(BaseModel):
    full_name: str
    email: EmailStr
    role: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        if v not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return v


class WaitlistJoinResponse(BaseModel):
    message: str
