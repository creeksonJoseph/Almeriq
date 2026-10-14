"""api/dependencies.py - Authentication dependencies for FastAPI route protection."""
from __future__ import annotations

from fastapi import Request, HTTPException, status, Depends
from core.config import COOKIE_NAME
from core.security import decode_access_token
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
