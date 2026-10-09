"""api/routers/auth.py - Endpoints for 2-Phase Auth & Progressive Onboarding Wizard."""
from __future__ import annotations

import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, Depends, status
from core.config import COOKIE_NAME, COOKIE_SECURE, COOKIE_SAMESITE, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    GoogleAuthRequest,
    UserOnboardingRequest,
    UserResponse,
    AuthMessageResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    SignupSendOtpRequest,
    SignupVerifyOtpRequest,
    SignupCompleteRequest,
)
from services import auth as svc
from api.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])

_SIGNUP_COOKIE = "alq_signup_token"


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set HttpOnly, Secure authentication cookie on HTTP response."""
    max_age_seconds = JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,         # Block JavaScript access to prevent token theft
        secure=COOKIE_SECURE,  # Require HTTPS transport
        samesite=COOKIE_SAMESITE, # Mitigate CSRF
        max_age=max_age_seconds,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    """Clear HttpOnly authentication cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
    )


@router.post("/auth/register", status_code=status.HTTP_201_CREATED, response_model=AuthMessageResponse)
@router.post("/api/auth/register", status_code=status.HTTP_201_CREATED, response_model=AuthMessageResponse)
async def register(body: UserRegisterRequest, response: Response) -> dict:
    """
    Legacy direct register (kept for backwards compat). Prefer the OTP flow.
    """
    response.headers["Cache-Control"] = "no-store"
    user, token = await svc.register_user(email=body.email, password=body.password)
    _set_auth_cookie(response, token)
    return {"message": "Account created. Please complete onboarding.", "user": user}


@router.post("/auth/signup/send-otp", status_code=status.HTTP_200_OK)
@router.post("/api/auth/signup/send-otp", status_code=status.HTTP_200_OK)
async def signup_send_otp(body: SignupSendOtpRequest, background_tasks: BackgroundTasks) -> dict:
    """Step 1: Send a 6-digit OTP to the provided email."""
    logger.info(f"[ROUTE-STEP1] POST /auth/signup/send-otp - email: {body.email}")
    await svc.signup_send_otp(body.email, background_tasks)
    logger.info(f"[ROUTE-STEP1] OTP sent successfully for {body.email}")
    return {"message": "Verification code sent."}


@router.post("/auth/signup/verify-otp", status_code=status.HTTP_200_OK)
@router.post("/api/auth/signup/verify-otp", status_code=status.HTTP_200_OK)
async def signup_verify_otp(body: SignupVerifyOtpRequest, response: Response) -> dict:
    """Step 2: Verify OTP and set signup_token as HttpOnly cookie."""
    logger.info(f"[ROUTE-STEP2] POST /auth/signup/verify-otp - email: {body.email}")
    signup_token = await svc.signup_verify_otp(body.email, body.otp)
    logger.info(f"[ROUTE-STEP2] JWT generated, setting HttpOnly cookie")
    response.set_cookie(
        key=_SIGNUP_COOKIE,
        value=signup_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=60 * 15,
        path="/",
    )
    logger.info(f"[ROUTE-STEP2] Cookie set successfully for {body.email}")
    return {"message": "Email verified."}


@router.post("/auth/signup/complete", status_code=status.HTTP_201_CREATED, response_model=AuthMessageResponse)
@router.post("/api/auth/signup/complete", status_code=status.HTTP_201_CREATED, response_model=AuthMessageResponse)
async def signup_complete(body: SignupCompleteRequest, request: Request, response: Response) -> dict:
    """Step 3: Read signup_token from HttpOnly cookie, create account, set auth cookie."""
    logger.info(f"[ROUTE-STEP3] POST /auth/signup/complete")
    signup_token = request.cookies.get(_SIGNUP_COOKIE)
    logger.info(f"[ROUTE-STEP3] Signup cookie present: {bool(signup_token)}")
    
    if not signup_token:
        logger.error(f"[ROUTE-STEP3] Signup token cookie missing")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please start again.",
        )
    
    response.headers["Cache-Control"] = "no-store"
    logger.info(f"[ROUTE-STEP3] Calling signup_complete service")
    user, token = await svc.signup_complete(signup_token, body.password)
    logger.info(f"[ROUTE-STEP3] User created: {user['email']}, ID: {user['id']}")
    
    _set_auth_cookie(response, token)
    logger.info(f"[ROUTE-STEP3] Auth cookie set")
    
    response.delete_cookie(
        key=_SIGNUP_COOKIE, path="/", httponly=True, secure=COOKIE_SECURE, samesite=COOKIE_SAMESITE
    )
    logger.info(f"[ROUTE-STEP3] Signup token cookie deleted")
    
    return {"message": "Account created. Please complete onboarding.", "user": user}


@router.post("/auth/login", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
@router.post("/api/auth/login", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
async def login(body: UserLoginRequest, response: Response) -> dict:
    """
    Phase 1: Minimal Login.
    """
    response.headers["Cache-Control"] = "no-store"
    user, token = await svc.authenticate_user(
        email=body.email,
        password=body.password,
    )
    _set_auth_cookie(response, token)
    return {"message": "Logged in successfully", "user": user}


@router.post("/auth/google", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
@router.post("/api/auth/google", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
async def google_auth(body: GoogleAuthRequest, response: Response) -> dict:
    """
    Phase 1: Google OAuth Sign-In / Registration.
    """
    response.headers["Cache-Control"] = "no-store"
    user, token = await svc.authenticate_google_user(credential=body.credential)
    _set_auth_cookie(response, token)
    return {"message": "Google authentication successful", "user": user}


@router.post("/auth/onboarding", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
@router.post("/api/auth/onboarding", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
async def complete_onboarding(
    body: UserOnboardingRequest,
    response: Response,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Phase 2: Post-Signup Onboarding Wizard.
    Updates step details (Personal, Identity Verification, Role selection)
    and marks onboarding completed when finished.
    """
    response.headers["Cache-Control"] = "no-store"
    updated_user = await svc.update_onboarding(
        user_id=current_user["id"],
        full_name=body.full_name,
        nationality=body.nationality,
        id_number=body.id_number,
        role=body.role,
    )
    return {"message": "Onboarding step saved", "user": updated_user}


@router.post("/auth/logout", status_code=status.HTTP_200_OK)
@router.post("/api/auth/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response) -> dict:
    """
    Log out user by expiring and clearing the HttpOnly cookie.
    """
    response.headers["Cache-Control"] = "no-store"
    _clear_auth_cookie(response)
    return {"message": "Logged out successfully"}


@router.get("/auth/me", response_model=UserResponse)
@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(
    response: Response,
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Retrieve current authenticated user profile.
    """
    response.headers["Cache-Control"] = "no-store"
    return current_user


@router.post("/auth/forgot-password", status_code=status.HTTP_200_OK)
@router.post("/api/auth/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(body: ForgotPasswordRequest, background_tasks: BackgroundTasks) -> dict:
    """Request a password reset email."""
    await svc.request_password_reset(body.email, background_tasks)
    return {"message": "If an account with that email exists, a reset link has been sent."}


@router.post("/auth/reset-password", status_code=status.HTTP_200_OK)
@router.post("/api/auth/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(body: ResetPasswordRequest) -> dict:
    """Verify OTP and update the password."""
    await svc.confirm_password_reset(body.email, body.otp, body.new_password)
    return {"message": "Password updated successfully. You can now log in."}
