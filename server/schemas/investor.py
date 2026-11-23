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
    preferred_sectors: list[str] = Field(default_factory=list)
    preferred_stages: list[str] = Field(default_factory=list)
    geographies: list[str] = Field(default_factory=list)
    check_size_min: Optional[float] = None
    check_size_max: Optional[float] = None
    lead_follow_preference: Optional[str] = None
    track_record: Optional[str] = None
    value_add: Optional[str] = None
    accreditation_status: Optional[str] = None
    target_return_percent: Optional[float] = None
    verified: bool = False
    years_investing: Optional[int] = None
    verification_url: Optional[str] = None
    notable_investments: Optional[str] = None
    companies_backed: Optional[int] = None
    exits: Optional[int] = None
    assets_under_management: Optional[str] = None
    time_commitment: Optional[str] = None
    contact_preference: Optional[str] = None
    contact_formats: list[str] = Field(default_factory=list)
    preferred_payment_methods: list[str] = Field(default_factory=lambda: ["visa"])
    notify_deal_updates: bool = True
    notify_valuation_changes: bool = True
    notify_messages: bool = True


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
    target_return_percent: Optional[float] = Field(default=None, ge=-100, le=1000)
    years_investing: Optional[int] = Field(default=None, ge=0, le=100)
    verification_url: Optional[str] = Field(default=None, max_length=1000)
    notable_investments: Optional[str] = Field(default=None, max_length=3000)
    companies_backed: Optional[int] = Field(default=None, ge=0, le=100000)
    exits: Optional[int] = Field(default=None, ge=0, le=100000)
    assets_under_management: Optional[str] = Field(default=None, max_length=120)
    time_commitment: Optional[str] = Field(default=None, max_length=100)
    contact_preference: Optional[str] = Field(default=None, max_length=100)
    contact_formats: Optional[list[str]] = Field(default=None, max_length=10)
    preferred_payment_methods: Optional[list[str]] = Field(default=None, max_length=4)
    notify_deal_updates: Optional[bool] = None
    notify_valuation_changes: Optional[bool] = None
    notify_messages: Optional[bool] = None

    @field_validator("preferred_payment_methods")
    @classmethod
    def validate_payment_methods(cls, value):
        allowed = {"paypal", "mastercard", "visa", "mpesa"}
        if value is not None and any(method not in allowed for method in value):
            raise ValueError("Choose supported payment methods only")
        return value

    @field_validator("verification_url")
    @classmethod
    def validate_verification_url(cls, value):
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("Verification links must use http or https")
        return value

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

    @field_validator("url")
    @classmethod
    def validate_document_url(cls, value):
        if not value.startswith(("https://", "http://")):
            raise ValueError("Document URLs must use http or https")
        return value


class StartupPitchCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=200)
    target_check_size: Optional[float] = Field(default=None, ge=0)
    website_url: Optional[str] = Field(default=None, max_length=1000)
    pitch_deck_url: Optional[str] = Field(default=None, max_length=1000)
    financials_url: Optional[str] = Field(default=None, max_length=1000)
    traction: Optional[str] = Field(default=None, max_length=3000)
    team_summary: Optional[str] = Field(default=None, max_length=3000)
    documents: list[PitchDocument] = Field(default_factory=list, max_length=20)

    @field_validator("website_url", "pitch_deck_url", "financials_url")
    @classmethod
    def validate_material_urls(cls, value):
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("Material URLs must use http or https")
        return value


class StartupPitchUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)
    location: Optional[str] = Field(default=None, max_length=200)
    target_check_size: Optional[float] = Field(default=None, ge=0)
    website_url: Optional[str] = Field(default=None, max_length=1000)
    pitch_deck_url: Optional[str] = Field(default=None, max_length=1000)
    financials_url: Optional[str] = Field(default=None, max_length=1000)
    traction: Optional[str] = Field(default=None, max_length=3000)
    team_summary: Optional[str] = Field(default=None, max_length=3000)
    documents: Optional[list[PitchDocument]] = Field(default=None, max_length=20)

    @field_validator("website_url", "pitch_deck_url", "financials_url")
    @classmethod
    def validate_material_urls(cls, value):
        if value is not None and not value.startswith(("https://", "http://")):
            raise ValueError("Material URLs must use http or https")
        return value


class InvestorPortfolioUpdateRequest(BaseModel):
    investment_amount: float = Field(gt=0)
    current_value: Optional[float] = Field(default=None, ge=0)
    ownership_percent: Optional[float] = Field(default=None, ge=0, le=100)
    investment_date: Optional[date] = None
    notes: Optional[str] = Field(default=None, max_length=3000)
    risk_level: Optional[str] = Field(default=None)
    payment_method: Optional[str] = Field(default=None, max_length=30)
    signature_data: Optional[str] = Field(default=None, max_length=250000)

    @field_validator("payment_method")
    @classmethod
    def validate_deal_payment_method(cls, value):
        if value is not None and value not in {"paypal", "mastercard", "visa", "mpesa"}:
            raise ValueError("Choose a supported demo payment method")
        return value

    @field_validator("signature_data")
    @classmethod
    def validate_signature_data(cls, value):
        if value is not None and not value.startswith("data:image/png;base64,"):
            raise ValueError("Signature must be a PNG data URL")
        return value

    @field_validator("risk_level")
    @classmethod
    def validate_risk_level(cls, value):
        if value is not None and value not in {"low", "medium", "high"}:
            raise ValueError("Risk level must be low, medium, or high")
        return value
