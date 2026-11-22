from __future__ import annotations
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ExpertProfileUpdate(BaseModel):
    headline: str | None = Field(default=None, max_length=200)
    bio: str | None = Field(default=None, max_length=4000)
    expertise: list[str] | None = None
    years_experience: int | None = Field(default=None, ge=0)
    location: str | None = Field(default=None, max_length=200)
    hourly_rate: float | None = Field(default=None, ge=0)
    availability: str | None = Field(default=None, max_length=500)
    portfolio_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True


class AdvisoryRequestCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    budget: float | None = Field(default=None, ge=0)


class AdvisoryRequestStatusUpdate(BaseModel):
    status: str = Field(pattern="^(accepted|declined|completed)$")
