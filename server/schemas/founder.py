"""schemas/founder.py - Founder workspace request and response contracts."""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FounderAnalysisRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=2000)
    problem: str = Field(..., min_length=10, max_length=2000)
    solution: str = Field(..., min_length=10, max_length=2000)
    customer: str = Field(..., min_length=2, max_length=500)
    location: str = Field(..., min_length=2, max_length=200)


class FounderAnalysisResponse(BaseModel):
    source: str
    summary: str
    market: str
    risks: list[str]
    mvp: list[str]
    roadmap: list[str]
    next_steps: list[str]
    # Populated when saved to DB
    venture_id: Optional[int] = None


class VentureOut(BaseModel):
    id: int
    user_id: int
    idea: str
    problem: str
    solution: str
    customer: str
    location: str
    source: str
    summary: str
    market: str
    risks: list[str]
    mvp: list[str]
    roadmap: list[str]
    next_steps: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class FounderValidationUpdate(BaseModel):
    dim_problem: Optional[bool] = None
    dim_solution: Optional[bool] = None
    dim_market_size: Optional[bool] = None
    dim_demand: Optional[bool] = None
    dim_competition: Optional[bool] = None
    dim_feasibility: Optional[bool] = None
    dim_business_model: Optional[bool] = None
    dim_legal: Optional[bool] = None
    dim_risk: Optional[bool] = None


class FounderValidationOut(BaseModel):
    dim_problem: bool
    dim_solution: bool
    dim_market_size: bool
    dim_demand: bool
    dim_competition: bool
    dim_feasibility: bool
    dim_business_model: bool
    dim_legal: bool
    dim_risk: bool
    score: int
    updated_at: Optional[str] = None


class FounderLegalCreate(BaseModel):
    filing_type: str = Field(..., pattern="^(company|ip)$")
    company_name: Optional[str] = None
    entity_type: Optional[str] = None
    jurisdiction: Optional[str] = None
    ip_title: Optional[str] = None
    ip_type: Optional[str] = None
    ip_description: Optional[str] = None


class FounderLegalOut(BaseModel):
    id: int
    filing_type: str
    ref_number: str
    status: str
    company_name: Optional[str] = None
    entity_type: Optional[str] = None
    jurisdiction: Optional[str] = None
    ip_title: Optional[str] = None
    ip_type: Optional[str] = None
    ip_description: Optional[str] = None
    filed_at: str


class FounderToolRequest(BaseModel):
    tool_key: str
    idea: str = Field(..., min_length=5, max_length=2000)
    customer: Optional[str] = ""
    location: Optional[str] = ""
    problem: Optional[str] = ""
    solution: Optional[str] = ""
    extra_params: Optional[dict] = None


class FounderToolResponse(BaseModel):
    tool_key: str
    source: str
    result: dict

