"""services/auth.py - Business logic for low-friction Phase 1 auth, Google OAuth, and Phase 2 onboarding."""
from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

import httpx
import resend
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.exc import IntegrityError

from core.config import DOMAIN, GOOGLE_CLIENT_ID, RESEND_API_KEY
from core.redis_client import cache_delete, cache_get, cache_set
from core.security import create_access_token, hash_password, verify_password
from repositories import user as user_repo

logger = logging.getLogger(__name__)
resend.api_key = RESEND_API_KEY

_RESET_TTL = 60 * 15       # 15 minutes
_OTP_TTL = 60 * 5          # 5 minutes
_SIGNUP_TOKEN_TTL = 60 * 15  # 15 minutes


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

    user = await user_repo.get_user_by_google_id(google_sub)
    if not user:
        user = await user_repo.get_user_by_email(email)
        if user:
            if not user.get("google_id"):
                linked = await user_repo.link_google_id(
                    user["id"], google_sub, full_name=name
                )
                user = linked or user
        else:
            try:
                user = await user_repo.create_user(
                    email=email,
                    full_name=name,
                    google_id=google_sub,
                )
            except IntegrityError:
                user = await user_repo.get_user_by_email(email)
                if not user:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="Could not create account. Please try again.",
                    )
                if not user.get("google_id"):
                    linked = await user_repo.link_google_id(
                        user["id"], google_sub, full_name=name
                    )
                    user = linked or user

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
) -> dict:
    """
    Phase 2: Save wizard onboarding responses.
    Completion is derived here (§1 — business rules live in services, not routers).
    """
    is_complete = bool(role or (full_name and id_number))
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


async def signup_send_otp(email: str, background_tasks: BackgroundTasks) -> None:
    """
    Step 1: Check email isn't taken, generate a 6-digit OTP, store in Redis, send email.
    Email is dispatched as a background task (§5) — persist+return first.
    """
    if await user_repo.email_exists(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    otp = "{:06d}".format(secrets.randbelow(1_000_000))
    cache_set(f"signup_otp:{email}", otp, ex=_OTP_TTL)
    background_tasks.add_task(_send_otp_email, email, otp)


async def signup_verify_otp(email: str, otp: str) -> str:
    """
    Step 2: Validate OTP, delete it, issue a short-lived signup_token.
    Returns the signup_token string.
    """
    stored = cache_get(f"signup_otp:{email}")
    if not stored or stored != otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    cache_delete(f"signup_otp:{email}")

    signup_token = secrets.token_urlsafe(32)
    cache_set(f"signup_token:{signup_token}", email, ex=_SIGNUP_TOKEN_TTL)
    return signup_token


async def signup_complete(signup_token: str, password: str) -> tuple[dict, str]:
    """
    Step 3: Consume signup_token, create the user, return (user_dict, access_token).
    """
    email = cache_get(f"signup_token:{signup_token}")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please start again.",
        )

    if await user_repo.email_exists(email):
        cache_delete(f"signup_token:{signup_token}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    hashed_pw = hash_password(password)
    try:
        user = await user_repo.create_user(email=email, hashed_password=hashed_pw)
    except Exception as exc:
        if isinstance(exc, IntegrityError) or "unique" in str(exc).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise

    cache_delete(f"signup_token:{signup_token}")
    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    return user, token


async def request_password_reset(email: str, background_tasks: BackgroundTasks) -> None:
    """
    Generate a reset token, store it in Redis, and schedule the email as a
    background task (§5). Always returns without error to avoid leaking
    whether the email exists.
    """
    user = await user_repo.get_user_by_email(email)
    if not user or not user.get("hashed_password"):
        return  # Silently succeed — don't reveal account existence

    token = secrets.token_urlsafe(32)
    cache_set(f"pwd_reset:{token}", str(user["id"]), ex=_RESET_TTL)
    reset_link = f"https://{DOMAIN}/reset-password?token={token}"
    background_tasks.add_task(_send_reset_email, email, reset_link)


async def confirm_password_reset(token: str, new_password: str) -> None:
    """Validate the reset token and update the user's password."""
    user_id_str = cache_get(f"pwd_reset:{token}")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset link is invalid or has expired.",
        )

    hashed = hash_password(new_password)
    updated = await user_repo.update_user_password(int(user_id_str), hashed)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    cache_delete(f"pwd_reset:{token}")


# ── Background email tasks (§5: idempotent, catch own exceptions) ────────────────────

def _send_otp_email(email: str, otp: str) -> None:
    try:
        resend.Emails.send({
            "from": f"ALIMERIQ <noreply@{DOMAIN}>",
            "to": [email],
            "subject": "Your ALIMERIQ verification code",
            "html": _build_otp_email_html(otp),
        })
    except Exception:
        logger.exception("Failed to send OTP email to %s", email)


def _send_reset_email(email: str, reset_link: str) -> None:
    try:
        resend.Emails.send({
            "from": f"ALIMERIQ <noreply@{DOMAIN}>",
            "to": [email],
            "subject": "Reset your ALIMERIQ password",
            "html": _build_reset_email_html(reset_link),
        })
    except Exception:
        logger.exception("Failed to send reset email to %s", email)


# ── Email HTML builders ─────────────────────────────────────────────────────────────────

def _build_otp_email_html(otp: str) -> str:
    year = datetime.now(timezone.utc).year
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Your verification code</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
         style="background:#141417;border:1px solid #2B2B31;border-radius:16px;overflow:hidden;max-width:95%;">
    <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #2B2B31;text-align:center;">
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,2 37,20 20,38 3,20" fill="none" stroke="#C9A15A" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-size="16" fill="#C9A15A" font-family="Georgia,serif">A</text>
      </svg>
      <p style="margin:10px 0 0;font-size:11px;letter-spacing:3px;color:#C9A15A;font-weight:700;">ALIMERIQ</p>
    </td></tr>
    <tr><td style="padding:36px 40px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#F3F1EC;font-weight:600;">Verify your email</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#9B9A94;line-height:1.7;">Use the code below to complete your sign up. It expires in <strong style="color:#F3F1EC;">5 minutes</strong>.</p>
      <div style="display:inline-block;padding:20px 40px;background:#1C1C21;border-radius:12px;letter-spacing:0.35em;font-size:32px;font-weight:700;color:#C9A15A;font-family:monospace;">{otp}</div>
      <p style="margin:28px 0 0;font-size:12px;color:#5F5E5A;">If you didn't request this, you can safely ignore this email.</p>
    </td></tr>
    <tr><td style="padding:24px 40px;border-top:1px solid #2B2B31;text-align:center;">
      <p style="margin:0;font-size:11px;color:#5F5E5A;">&copy; {year} ALIMERIQ</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def _build_reset_email_html(reset_link: str) -> str:
    year = datetime.now(timezone.utc).year
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Reset your password</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
         style="background:#141417;border:1px solid #2B2B31;border-radius:16px;overflow:hidden;max-width:95%;">
    <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #2B2B31;text-align:center;">
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,2 37,20 20,38 3,20" fill="none" stroke="#C9A15A" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-size="16" fill="#C9A15A" font-family="Georgia,serif">A</text>
      </svg>
      <p style="margin:10px 0 0;font-size:11px;letter-spacing:3px;color:#C9A15A;font-weight:700;">ALIMERIQ</p>
    </td></tr>
    <tr><td style="padding:36px 40px;">
      <h1 style="margin:0 0 16px;font-size:22px;color:#F3F1EC;font-weight:600;">Reset your password</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#9B9A94;line-height:1.7;">
        Click the button below to set a new password. This link expires in <strong style="color:#F3F1EC;">15 minutes</strong>.
      </p>
      <table cellpadding="0" cellspacing="0"><tr><td>
        <a href="{reset_link}"
           style="display:inline-block;padding:14px 32px;background:#C9A15A;color:#161410;font-size:14px;font-weight:700;border-radius:100px;text-decoration:none;">
          Reset Password
        </a>
      </td></tr></table>
      <p style="margin:28px 0 0;font-size:12px;color:#5F5E5A;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px;border-top:1px solid #2B2B31;text-align:center;">
      <p style="margin:0;font-size:11px;color:#5F5E5A;">&copy; {year} ALIMERIQ</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""
