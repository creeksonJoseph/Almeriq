"""api/routers/auth.py - Authentication routes using HttpOnly, Secure cookies."""
from __future__ import annotations

from fastapi import APIRouter, Response, Depends, status
from core.config import COOKIE_NAME, COOKIE_SECURE, COOKIE_SAMESITE, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
from schemas.auth import UserRegisterRequest, UserLoginRequest, UserResponse, AuthMessageResponse
from services import auth as svc
from api.dependencies import get_current_user

router = APIRouter(tags=["auth"])


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set HttpOnly, Secure authentication cookie on HTTP response."""
    max_age_seconds = JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,         # §Security: Block JavaScript access to prevent XSS token theft
        secure=COOKIE_SECURE,  # §Security: Require HTTPS transport
        samesite=COOKIE_SAMESITE, # §Security: Mitigate CSRF attacks
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
    Register a new user account.
    Sets HttpOnly auth_token cookie upon successful registration.
    """
    response.headers["Cache-Control"] = "no-store"
    user, token = await svc.register_user(
        full_name=body.full_name,
        email=body.email,
        password=body.password,
        role=body.role,
    )
    _set_auth_cookie(response, token)
    return {"message": "Account created successfully", "user": user}


@router.post("/auth/login", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
@router.post("/api/auth/login", status_code=status.HTTP_200_OK, response_model=AuthMessageResponse)
async def login(body: UserLoginRequest, response: Response) -> dict:
    """
    Authenticate user credentials.
    Sets HttpOnly auth_token cookie upon successful login.
    """
    response.headers["Cache-Control"] = "no-store"
    user, token = await svc.authenticate_user(
        email=body.email,
        password=body.password,
    )
    _set_auth_cookie(response, token)
    return {"message": "Logged in successfully", "user": user}


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
    Requires valid HttpOnly cookie session.
    """
    response.headers["Cache-Control"] = "no-store"
    return current_user
