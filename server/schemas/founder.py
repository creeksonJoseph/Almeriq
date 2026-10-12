"""schemas/founder.py - Founder workspace request and response contracts."""
from __future__ import annotations

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
