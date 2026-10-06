"""services/auth.py - Authentication business logic (registration, login, profile retrieval)."""
from __future__ import annotations

from fastapi import HTTPException, status
import asyncpg

from core.security import hash_password, verify_password, create_access_token
from repositories import user as user_repo


async def register_user(
    full_name: str,
    email: str,
    password: str,
    role: str = "user",
) -> tuple[dict, str]:
    """
    Registers a new user.
    Returns (user_dict, access_token).
    Raises HTTP 409 if email already registered.
    """
    if await user_repo.email_exists(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    hashed_pw = hash_password(password)
    try:
        user = await user_repo.create_user(
            full_name=full_name,
            email=email,
            hashed_password=hashed_pw,
            role=role,
        )
    except asyncpg.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists",
        )

    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    return user, token


async def authenticate_user(email: str, password: str) -> tuple[dict, str]:
    """
    Authenticates a user via email & password.
    Returns (user_dict, access_token).
    Raises HTTP 401 on invalid credentials.
    """
    user = await user_repo.get_user_by_email(email)
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    user_payload = {
        "id": user["id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"],
    }
    return user_payload, token


async def get_user_profile(user_id: int) -> dict:
    """Fetch user profile by user_id."""
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
