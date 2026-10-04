"""api/routers/waitlist.py — HTTP only: parse, delegate, respond. No queries or business rules."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Response
from schemas.waitlist import WaitlistJoinRequest, WaitlistJoinResponse
from services import waitlist as svc

router = APIRouter(prefix="/waitlist", tags=["waitlist"])


@router.post("", status_code=201, response_model=WaitlistJoinResponse)
async def join_waitlist(
    body: WaitlistJoinRequest,
    background_tasks: BackgroundTasks,
    response: Response,
) -> dict:
    """
    POST /waitlist
    - 201: successfully added
    - 409: email already registered
    - 422: validation error (pydantic)

    Cache-Control §7.2: this is a mutating endpoint → no-store.
    """
    response.headers["Cache-Control"] = "no-store"
    return await svc.join_waitlist(
        full_name=body.full_name,
        email=body.email,
        role=body.role,
        background_tasks=background_tasks,
    )
