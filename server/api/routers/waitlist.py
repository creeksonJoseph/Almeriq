"""api/routers/waitlist.py - HTTP only: parse, delegate, respond. No queries or business rules."""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Response
from schemas.waitlist import (
    WaitlistJoinRequest,
    WaitlistJoinResponse,
    WaitlistUpdateRequest,
    WaitlistOTPRequest,
    WaitlistOTPVerifyRequest,
    WaitlistOTPResponse,
)
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


@router.put("", status_code=200, response_model=WaitlistJoinResponse)
async def update_waitlist(
    body: WaitlistUpdateRequest,
    background_tasks: BackgroundTasks,
    response: Response,
) -> dict:
    """
    PUT /waitlist
    - 200: successfully updated
    - 401: verification failed / missing OTP
    - 404: email not found
    - 422: validation error (pydantic)
    """
    response.headers["Cache-Control"] = "no-store"
    return await svc.update_waitlist(
        full_name=body.full_name,
        email=body.email,
        role=body.role,
        background_tasks=background_tasks,
        otp_code=body.otp_code,
        verification_token=body.verification_token,
    )




@router.post("/otp/request", status_code=200, response_model=WaitlistOTPResponse)
async def request_otp(
    body: WaitlistOTPRequest,
    background_tasks: BackgroundTasks,
    response: Response,
) -> dict:
    """
    POST /waitlist/otp/request
    - 200: OTP sent successfully
    - 404: email not found
    - 422: validation error
    """
    response.headers["Cache-Control"] = "no-store"
    return await svc.request_otp(
        email=body.email,
        background_tasks=background_tasks,
    )


@router.post("/otp/verify", status_code=200, response_model=WaitlistOTPResponse)
async def verify_otp(
    body: WaitlistOTPVerifyRequest,
    response: Response,
) -> dict:
    """
    POST /waitlist/otp/verify
    - 200: OTP verified successfully
    - 400: invalid OTP format
    - 401: invalid or expired OTP
    - 422: validation error
    """
    response.headers["Cache-Control"] = "no-store"
    return await svc.verify_otp(
        email=body.email,
        otp_code=body.otp_code,
    )
