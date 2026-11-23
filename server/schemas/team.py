from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


class TeamInvitationCreate(BaseModel):
    invitee_id: int = Field(gt=0)
    message: str | None = Field(default=None, max_length=2000)


class TeamInvitationResponse(BaseModel):
    status: Literal["accepted", "declined"]


class TeamInvitationOut(BaseModel):
    id: int
    founder_id: int
    invitee_id: int
    message: str | None = None
    status: str
