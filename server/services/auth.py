"""services/auth.py - Business logic for low-friction Phase 1 auth, Google OAuth, and Phase 2 onboarding."""
from __future__ import annotations

import httpx
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from core.config import GOOGLE_CLIENT_ID
from core.security import hash_password, verify_password, create_access_token
from repositories import user as user_repo


async def register_user(email: str, password: str) -> tuple[dict, str]:
    """
    Phase 1: Low-Friction Gate Registration.
    Captures only Email and Password. Sets onboarding_completed=False.
    Returns (user_dict, access_token).
    """
    if await user_repo.email_exists(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    hashed_pw = hash_password(password)
    try:
        user = await user_repo.create_user(
            email=email,
            hashed_password=hashed_pw,
        )
    except Exception as exc:
        if isinstance(exc, IntegrityError) or "unique" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )
        raise

    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    return user, token


async def authenticate_user(email: str, password: str) -> tuple[dict, str]:
    """
    Phase 1: Low-Friction Login.
    """
    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.get("hashed_password"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google Sign-In. Please sign in with Google.",
        )

    if not verify_password(password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "nationality": user["nationality"],
        "id_number": user["id_number"],
        "role": user["role"],
        "onboarding_completed": user["onboarding_completed"],
        "created_at": user["created_at"],
    }
    return user_payload, token


async def authenticate_google_user(credential: str) -> tuple[dict, str]:
    """
    Verify Google ID Token credential and register/login user.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google OAuth token",
                )
            payload = resp.json()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to verify Google credential at this time",
        )

    google_sub = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name")

    if not email or not google_sub:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account token is missing email or sub identifier",
        )

    # Optional aud check if GOOGLE_CLIENT_ID is configured
    if GOOGLE_CLIENT_ID and payload.get("aud") != GOOGLE_CLIENT_ID:
        # Note: log warning or enforce client_id match
        pass

    # Check if user already exists by google_id or email
    user = await user_repo.get_user_by_google_id(google_sub)
    if not user:
        user = await user_repo.get_user_by_email(email)
        if not user:
            # Create user with Google info
            user = await user_repo.create_user(
                email=email,
                full_name=name,
                google_id=google_sub,
            )

    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "nationality": user["nationality"],
        "id_number": user["id_number"],
        "role": user["role"],
        "onboarding_completed": user.get("onboarding_completed", False),
        "created_at": user["created_at"],
    }
    return user_payload, token


async def update_onboarding(
    user_id: int,
    full_name: str | None = None,
    nationality: str | None = None,
    id_number: str | None = None,
    role: str | None = None,
    is_complete: bool = False,
) -> dict:
    """
    Phase 2: Save wizard onboarding responses.
    """
    updated_user = await user_repo.update_user_onboarding(
        user_id=user_id,
        full_name=full_name,
        nationality=nationality,
        id_number=id_number,
        role=role,
        onboarding_completed=is_complete,
    )
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User record not found",
        )
    return updated_user


async def get_user_profile(user_id: int) -> dict:
    """Fetch complete profile for user."""
    user = await user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
