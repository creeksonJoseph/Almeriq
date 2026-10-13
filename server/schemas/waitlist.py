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

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = " ".join(v.strip().split())
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        cleaned = v.strip() if isinstance(v, str) else v
        if cleaned not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return cleaned


class WaitlistUpdateRequest(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    otp_code: str | None = None
    verification_token: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = " ".join(v.strip().split())
        if len(v) < 2:
            raise ValueError("full_name must be at least 2 characters")
        return v

    @field_validator("role")
    @classmethod
    def role_allowed(cls, v: str) -> str:
        cleaned = v.strip() if isinstance(v, str) else v
        if cleaned not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return cleaned


class WaitlistJoinResponse(BaseModel):
    message: str


class WaitlistOTPRequest(BaseModel):
    email: EmailStr


class WaitlistOTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str

    @field_validator("otp_code")
    @classmethod
    def otp_not_empty(cls, v: str) -> str:
        if not v.strip() or len(v.strip()) != 6:
            raise ValueError("OTP must be 6 digits")
        return v.strip()


class WaitlistOTPResponse(BaseModel):
    message: str
    verified: bool = False
    verification_token: str | None = None

