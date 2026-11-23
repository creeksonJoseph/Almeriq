"""api/dependencies.py - Authentication dependencies for FastAPI route protection."""
from __future__ import annotations

from fastapi import Request, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from core.config import COOKIE_NAME
from core.db import get_db
from core.security import decode_access_token
from repositories import provider_profile as provider_repo
from services import auth as auth_service


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency to extract and authenticate the current user.

    Security Strategy:
    1. Extracts JWT token from HttpOnly cookie `COOKIE_NAME`.
    2. Fallback to `Authorization: Bearer <token>` header if cookie is missing.
    3. Validates JWT signature and expiration.
    4. Retrieves user profile from DB.
    """
    token: str | None = request.cookies.get(COOKIE_NAME)

    # Secondary fallback: Authorization header
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        )

    return await auth_service.get_user_profile(user_id)


async def get_current_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """FastAPI dependency to verify that the current user has admin privileges."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to access this resource",
        )
    return current_user


async def get_current_provider_user(current_user: dict = Depends(get_current_user)) -> dict:
    """FastAPI dependency to verify that the current user is an infrastructure provider."""
    if current_user.get("role") != "INFRASTRUCTURE_PROVIDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Provider account required",
        )
    return current_user


async def get_current_provider_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_provider_user),
) -> dict:
    """Return the provider profile for the current provider user (enforces provider role)."""
    profile = await provider_repo.get_provider_profile_by_user_id(
        current_user["id"], session=db
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider profile not found. Complete provider onboarding first.",
        )
    return profile



async def get_current_job_owner(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Resolve the authenticated founder or provider as a job-posting owner."""
    role = (current_user.get("role") or "").lower()
    if role == "founder":
        return {"provider_id": None, "founder_user_id": int(current_user["id"])}
    if role == "INFRASTRUCTURE_PROVIDER":
        profile = await provider_repo.get_provider_profile_by_user_id(
            current_user["id"], session=db
        )
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Provider profile not found. Complete provider onboarding first.",
            )
        return {"provider_id": int(profile["id"]), "founder_user_id": None}
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Founder or infrastructure provider account required.",
    )
