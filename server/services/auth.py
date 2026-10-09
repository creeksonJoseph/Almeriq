"""services/auth.py - Business logic for low-friction Phase 1 auth, Google OAuth, and Phase 2 onboarding."""
from __future__ import annotations

import logging
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

import jwt

import httpx
import resend
from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.exc import IntegrityError

from core.config import DOMAIN, GOOGLE_CLIENT_ID, JWT_ALGORITHM, JWT_SECRET_KEY, RESEND_API_KEY
from core.redis_client import cache_delete, cache_get, cache_set, cache_set_if_absent
from core.security import create_access_token, hash_password, verify_password
from repositories import user as user_repo

logger = logging.getLogger(__name__)
resend.api_key = RESEND_API_KEY

_RESET_TTL = 60 * 15       # 15 minutes
_OTP_TTL = 60 * 5          # 5 minutes


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
    logger.info(f"[SIGNUP-STEP1] Starting for email: {email}")
    
    email_taken = await user_repo.email_exists(email)
    logger.info(f"[SIGNUP-STEP1] Email exists check: {email_taken}")
    
    if email_taken:
        logger.warning(f"[SIGNUP-STEP1] Email already registered: {email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists. Please log in.",
        )

    otp = "{:06d}".format(secrets.randbelow(1_000_000))
    logger.info(f"[SIGNUP-STEP1] Generated OTP for {email}")
    
    cache_set(f"signup_otp:{email}", otp, ex=_OTP_TTL)
    logger.info(f"[SIGNUP-STEP1] Stored OTP in cache for {email}")
    
    background_tasks.add_task(_send_otp_email, email, otp)
    logger.info(f"[SIGNUP-STEP1] Queued email task for {email}")


async def signup_verify_otp(email: str, otp: str) -> str:
    """
    Step 2: Validate OTP, delete it, issue a short-lived JWT signup_token.
    JWT is self-contained — no Redis lookup needed at step 3.
    """
    logger.info(f"[SIGNUP-STEP2] Starting for email: {email}")
    
    stored = cache_get(f"signup_otp:{email}")
    logger.info(f"[SIGNUP-STEP2] OTP found in cache: {bool(stored)}")
    
    if not stored or stored != otp.strip():
        logger.warning(f"[SIGNUP-STEP2] OTP mismatch for {email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )
    
    cache_delete(f"signup_otp:{email}")
    logger.info(f"[SIGNUP-STEP2] Deleted OTP from cache for {email}")

    payload = {
        "sub": email,
        "purpose": "signup",
        "jti": secrets.token_urlsafe(24),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    signup_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    logger.info(f"[SIGNUP-STEP2] Generated JWT signup_token for {email}")
    
    return signup_token


async def signup_complete(signup_token: str, password: str) -> tuple[dict, str]:
    """
    Step 3: Decode JWT signup_token, create the user, return (user_dict, access_token).
    No Redis lookup — JWT is self-contained.
    """
    logger.info("[SIGNUP-STEP3] Starting with signup token")
    
    try:
        payload = jwt.decode(signup_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        logger.info(f"[SIGNUP-STEP3] JWT decoded successfully. Payload: {payload}")
        
        if payload.get("purpose") != "signup":
            logger.error(f"[SIGNUP-STEP3] Invalid purpose in JWT: {payload.get('purpose')}")
            raise ValueError("wrong purpose")
        
        email: str = payload["sub"]
        logger.info(f"[SIGNUP-STEP3] Extracted email from JWT: {email}")
    except Exception as e:
        logger.error(f"[SIGNUP-STEP3] JWT decode failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Signup session expired. Please start again.",
        )

    signup_claim = payload.get("jti") or hashlib.sha256(signup_token.encode()).hexdigest()
    claim_key = f"signup_claim:{signup_claim}"
    if not cache_set_if_absent(claim_key, email, ex=_RESET_TTL):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This signup has already been submitted or is currently being processed.",
        )

    logger.info(f"[SIGNUP-STEP3] Hashing password for {email}")
    hashed_pw = hash_password(password)
    
    logger.info(f"[SIGNUP-STEP3] Attempting to create user: {email}")
    try:
        user = await user_repo.create_user(email=email, hashed_password=hashed_pw)
        logger.info(f"[SIGNUP-STEP3] User created successfully. ID: {user['id']}, Email: {user['email']}")
    except IntegrityError as exc:
        cache_delete(claim_key)
        constraint_name = getattr(getattr(exc.orig, "diag", None), "constraint_name", None)
        logger.error(
            "[SIGNUP-STEP3] User creation integrity error for %s: constraint=%s, error=%s",
            email,
            constraint_name or "unknown",
            exc.orig,
        )
        if constraint_name and "email" in constraint_name.lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create your account. Please try again later.",
        ) from exc
    except Exception:
        cache_delete(claim_key)
        logger.exception("[SIGNUP-STEP3] Unexpected user creation failure for %s", email)
        raise

    logger.info(f"[SIGNUP-STEP3] Creating access token for user {user['id']}")
    token = create_access_token(data={"sub": str(user["id"]), "email": user["email"]})
    logger.info(f"[SIGNUP-STEP3] Signup complete for {email}")
    
    return user, token


async def request_password_reset(email: str, background_tasks: BackgroundTasks) -> None:
    """
    Send a 6-digit OTP to the email for password reset.
    Silently succeeds if account doesn't exist to avoid leaking info.
    """
    user = await user_repo.get_user_by_email(email)
    if not user or not user.get("hashed_password"):
        return

    otp = "{:06d}".format(secrets.randbelow(1_000_000))
    cache_set(f"pwd_reset_otp:{email}", otp, ex=_RESET_TTL)
    background_tasks.add_task(_send_reset_otp_email, email, otp)


async def confirm_password_reset(email: str, otp: str, new_password: str) -> None:
    """Verify the OTP and update the user's password."""
    stored = cache_get(f"pwd_reset_otp:{email}")
    if not stored or stored != otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    user = await user_repo.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    hashed = hash_password(new_password)
    await user_repo.update_user_password(user["id"], hashed)
    cache_delete(f"pwd_reset_otp:{email}")


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


def _send_reset_otp_email(email: str, otp: str) -> None:
    try:
        resend.Emails.send({
            "from": f"ALIMERIQ <noreply@{DOMAIN}>",
            "to": [email],
            "subject": "Your ALIMERIQ password reset code",
            "html": _build_reset_otp_email_html(otp),
        })
    except Exception:
        logger.exception("Failed to send reset OTP email to %s", email)


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


def _build_reset_otp_email_html(otp: str) -> str:
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
    <tr><td style="padding:36px 40px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#F3F1EC;font-weight:600;">Reset your password</h1>
      <p style="margin:0 0 28px;font-size:14px;color:#9B9A94;line-height:1.7;">Use the code below to reset your password. It expires in <strong style="color:#F3F1EC;">15 minutes</strong>.</p>
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
