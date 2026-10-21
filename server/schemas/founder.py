"""schemas/founder.py - Founder workspace request and response contracts."""
from __future__ import annotations
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FounderAnalysisRequest(BaseModel):
    idea: str = Field(..., min_length=10, max_length=500)
    problem: str = Field(..., min_length=10, max_length=500)
    solution: str = Field(..., min_length=10, max_length=500)
    customer: str = Field(..., min_length=2, max_length=200)
    location: str = Field(..., min_length=2, max_length=200)


class FounderBriefSaveRequest(BaseModel):
    """Save venture brief without triggering AI — used by the new analysis-hub flow."""
    idea: str = Field(..., min_length=10, max_length=500)
    problem: str = Field(..., min_length=10, max_length=500)
    solution: str = Field(..., min_length=10, max_length=500)
    customer: str = Field(..., min_length=2, max_length=200)
    location: str = Field(..., min_length=2, max_length=200)


class FounderBriefSaveResponse(BaseModel):
    venture_id: int
    message: str



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
    # Which ai-tool analyses have been run for this venture's brief
    analyses_run: list[str] = []
    # Content hash of the brief inputs (used by frontend for cache lookup)
    content_hash: Optional[str] = None

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
    idea: str = Field(..., min_length=5, max_length=500)
    customer: Optional[str] = Field(default="", max_length=200)
    location: Optional[str] = Field(default="", max_length=200)
    problem: Optional[str] = Field(default="", max_length=500)
    solution: Optional[str] = Field(default="", max_length=500)
    extra_params: Optional[dict] = None
    # Optional: link this tool run to an existing pending venture so it gets updated
    venture_id: Optional[int] = None


class FounderToolResponse(BaseModel):
    tool_key: str
    source: str
    result: dict
    venture_id: Optional[int] = None

