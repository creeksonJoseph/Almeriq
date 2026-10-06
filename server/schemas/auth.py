"""schemas/auth.py - Pydantic models for authentication requests and responses."""
from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, example="Jane Doe")
    email: EmailStr = Field(..., example="jane@example.com")
    password: str = Field(..., min_length=8, max_length=128, example="SecretPassword123!")
    role: str = Field(default="user", example="founder")


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., example="jane@example.com")
    password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthMessageResponse(BaseModel):
    message: str
    user: UserResponse
