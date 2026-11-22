from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional

class InvestorProfileResponse(BaseModel):
    id: int
    user_id: int
    firm_name: Optional[str] = None
    investment_focus: Optional[str] = None
    check_size: Optional[str] = None
    location: Optional[str] = None
    about: Optional[str] = None
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


class InvestmentRequestCreate(BaseModel):
    pitch_id: int = Field(gt=0)
    amount: Optional[float] = Field(default=None, ge=0)


class InvestmentRequestStatusUpdate(BaseModel):
    status: str


class StartupPitchCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)


class StartupPitchUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    summary: Optional[str] = Field(default=None, max_length=10000)
    sector: Optional[str] = Field(default=None, max_length=120)
    stage: Optional[str] = Field(default=None, max_length=80)
    ask_amount: Optional[float] = Field(default=None, ge=0)
