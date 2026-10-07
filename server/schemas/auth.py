"""schemas/auth.py - Pydantic models for authentication and progressive onboarding."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegisterRequest(BaseModel):
    """Phase 1: Low-Friction Gate - Email & Password only."""
    email: EmailStr = Field(..., example="founder@example.com")
    password: str = Field(..., min_length=8, max_length=128, example="SecurePassword123!")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class UserLoginRequest(BaseModel):
    """Phase 1: Low-Friction Login."""
    email: EmailStr = Field(..., example="founder@example.com")
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().lower()
        return v


class GoogleAuthRequest(BaseModel):
    """Google OAuth ID Token verification."""
    credential: str = Field(..., description="Google ID Token from Google Identity Services")


class UserOnboardingRequest(BaseModel):
    """Phase 2: Post-Signup Onboarding Wizard fields."""
    full_name: str | None = Field(default=None, min_length=2, max_length=100)
    nationality: str | None = Field(default=None, max_length=100)
    id_number: str | None = Field(default=None, max_length=100)
    role: str | None = Field(default=None, max_length=50)


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    nationality: str | None = None
    id_number: str | None = None
    role: str = "user"
    onboarding_completed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class AuthMessageResponse(BaseModel):
    message: str
    user: UserResponse
