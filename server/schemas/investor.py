from __future__ import annotations
from pydantic import BaseModel
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
