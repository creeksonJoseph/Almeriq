from __future__ import annotations

from datetime import date
from pydantic import BaseModel, Field, field_validator
from typing import Optional


class InvestorProfileResponse(BaseModel):
    id: int
    user_id: int
    firm_name: Optional[str] = None
    investment_focus: Optional[str] = None
    check_size: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
    investor_type: Optional[str] = None
    preferred_sectors: list[str] = []
    preferred_stages: list[str] = []
    geographies: list[str] = []
    check_size_min: Optional[float] = None
    check_size_max: Optional[float] = None
    lead_follow_preference: Optional[str] = None
    track_record: Optional[str] = None
    value_add: Optional[str] = None
    accreditation_status: Optional[str] = None
    verified: bool = False


class StartupPitchResponse(BaseModel):
    id: int
    founder_id: int
    title: str


class InvestmentResponse(BaseModel):
    id: int
    investor_id: int
    pitch_id: int
    status: str = "pending"


class InvestorProfileUpdateRequest(BaseModel):
    firm_name: Optional[str] = Field(default=None, max_length=200)
    investment_focus: Optional[str] = Field(default=None, max_length=500)
    check_size: Optional[str] = Field(default=None, max_length=100)
    location: Optional[str] = Field(default=None, max_length=200)
    about: Optional[str] = Field(default=None, max_length=3000)
    investor_type: Optional[str] = Field(default=None, max_length=80)
    preferred_sectors: Optional[list[str]] = Field(default=None, max_length=30)
    preferred_stages: Optional[list[str]] = Field(default=None, max_length=20)
    geographies: Optional[list[str]] = Field(default=None, max_length=30)
    check_size_min: Optional[float] = Field(default=None, ge=0)
    check_size_max: Optional[float] = Field(default=None, ge=0)
    lead_follow_preference: Optional[str] = Field(default=None, max_length=30)
    track_record: Optional[str] = Field(default=None, max_length=3000)
    value_add: Optional[str] = Field(default=None, max_length=3000)
    accreditation_status: Optional[str] = Field(default=None, max_length=80)

    @field_validator("lead_follow_preference")
    @classmethod
    def validate_lead_follow(cls, value):
        if value is not None and value not in {"lead", "follow", "either"}:
            raise ValueError("Choose lead, follow, or either")
        return value

    @field_validator("check_size_max")
    @classmethod
    def validate_check_size_range(cls, value, info):
        minimum = info.data.get("check_size_min")
        if value is not None and minimum is not None and value < minimum:
            raise ValueError("Maximum check size cannot be less than minimum")
        return value


class InvestmentRequestCreate(BaseModel):
    pitch_id: int = Field(gt=0)
    amount: Optional[float] = Field(default=None, ge=0)


class InvestmentRequestStatusUpdate(BaseModel):
    status: str


class PitchDocument(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    url: str = Field(min_length=8, max_length=1000)


class StartupPitchCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=200)
    website_url: Optional[str] = Field(default=None, max_length=1000)
    pitch_deck_url: Optional[str] = Field(default=None, max_length=1000)
    financials_url: Optional[str] = Field(default=None, max_length=1000)
    traction: Optional[str] = Field(default=None, max_length=3000)
    team_summary: Optional[str] = Field(default=None, max_length=3000)
    documents: list[PitchDocument] = Field(default_factory=list, max_length=20)


class StartupPitchUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=200)
    website_url: Optional[str] = Field(default=None, max_length=1000)
    pitch_deck_url: Optional[str] = Field(default=None, max_length=1000)
    financials_url: Optional[str] = Field(default=None, max_length=1000)
    traction: Optional[str] = Field(default=None, max_length=3000)
    team_summary: Optional[str] = Field(default=None, max_length=3000)
    documents: Optional[list[PitchDocument]] = Field(default=None, max_length=20)


class InvestorPortfolioUpdateRequest(BaseModel):
    investment_amount: float = Field(gt=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    ownership_percent: Optional[float] = Field(default=None, ge=0, le=100)
    investment_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=3000)
