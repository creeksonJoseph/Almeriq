"""services/waitlist.py - business logic and side-effect orchestration.

Principle §1: persist first, return 201, then do expensive side effects
(email send) in a background task. The router passes a BackgroundTasks
handle; the service schedules the email task and returns immediately.
"""
from __future__ import annotations
import logging
import random
import string

from sqlalchemy.exc import IntegrityError
import resend
from fastapi import BackgroundTasks, HTTPException

from core.config import DOMAIN, RESEND_API_KEY
from core.security import create_access_token, decode_access_token
from repositories import waitlist as repo
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)

resend.api_key = RESEND_API_KEY

# ── email template ────────────────────────────────────────────────────────────
from datetime import datetime, timezone

ROLE_LINES = {
    "Founder": "As a <strong>Founder</strong>, you'll get guided step-by-step - idea validation, market analysis, business plan, MVP scope, and legal registration.",
    "Investor": "As an <strong>Investor</strong>, you'll access a curated pipeline of vetted startups and manage every deal in one place.",
    "Job Seeker": "As a <strong>Job Seeker</strong>, you'll be matched with fast-growing startups that need your exact skills.",
    "Infrastructure Provider": "As an <strong>Infrastructure Provider</strong>, you'll list your assets - trucks, servers, satellites - and connect with startups ready to pay.",
}

FEATURES = [
    "AI-guided company building for Founders",
    "Curated investor deal-flow &amp; portfolio management",
    "Smart talent matching for startup roles",
    "Infrastructure marketplace - lease what you need",
    "Digital deal signing &amp; payment in one place",
]


def _build_email_html(full_name: str, email: str, role: str) -> str:
    role_line = ROLE_LINES.get(role, f"As a <strong>{role}</strong>, you'll be first to access the features built for you.")
    year = datetime.now(timezone.utc).year
    feature_rows = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #2B2B31;">'
        f'<span style="color:#C9A15A;margin-right:10px;">&#9670;</span>'
        f'<span style="font-size:13px;color:#F3F1EC;">{f}</span></td></tr>'
        for f in FEATURES
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Welcome to ALIMERIQ</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
         style="background:#141417;border:1px solid #2B2B31;border-radius:16px;overflow:hidden;max-width:95%;">
    <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #2B2B31;text-align:center;">
            <div style="display:inline-block;color:#F2CA50;font-family:Georgia,serif;font-size:38px;font-weight:700;line-height:40px;opacity:1;">A</div>
            <p style="margin:10px 0 0;font-size:11px;letter-spacing:3px;color:#F2CA50;font-weight:700;opacity:1;">ALIMERIQ</p>
    </td></tr>
    <tr><td style="padding:36px 40px;">
      <h1 style="margin:0 0 8px;font-size:26px;color:#F3F1EC;font-weight:600;line-height:1.25;">
        You're on the list, {full_name.split()[0]}. 🎉
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9B9A94;line-height:1.7;">
        Welcome to ALIMERIQ - connecting <strong style="color:#F3F1EC;">founders</strong>,
        <strong style="color:#F3F1EC;">investors</strong>,
        <strong style="color:#F3F1EC;">job seekers</strong>, and
        <strong style="color:#F3F1EC;">infrastructure providers</strong> under one roof.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:rgba(201,161,90,0.08);border:1px solid #C9A15A;border-radius:10px;margin-bottom:28px;">
        <tr><td style="padding:16px 20px;font-size:13.5px;color:#F3F1EC;line-height:1.6;">{role_line}</td></tr>
      </table>
      <p style="margin:0 0 28px;font-size:13.5px;color:#9B9A94;line-height:1.7;">
        We'll reach out to <a href="mailto:{email}" style="color:#C9A15A;text-decoration:none;">{email}</a>
        the moment we go live. Keep building.
      </p>
      <p style="margin:0 0 14px;font-size:11px;letter-spacing:1.5px;color:#5F5E5A;font-weight:700;">WHAT'S COMING</p>
      <table width="100%" cellpadding="0" cellspacing="0">{feature_rows}</table>
    </td></tr>
    <tr><td style="padding:24px 40px;border-top:1px solid #2B2B31;text-align:center;">
      <p style="margin:0;font-size:11px;color:#5F5E5A;line-height:1.6;">
        &copy; {year} ALIMERIQ &nbsp;|&nbsp;
        <a href="https://{DOMAIN}" style="color:#9B9A94;text-decoration:none;">{DOMAIN}</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


# ── background task - idempotent, catches its own exceptions (§5) ─────────────
def _send_confirmation_email(full_name: str, email: str, role: str) -> None:
    """Runs after the 201 is already sent. Must be idempotent and self-contained."""
    try:
        resend.Emails.send({
            "from": f"ALIMERIQ <waitlist@{DOMAIN}>",
            "to": [email],
            "subject": "You're on the ALIMERIQ waitlist 🎉",
            "html": _build_email_html(full_name, email, role),
        })
        logger.info("Confirmation email sent to %s", email)
    except Exception:
        # Log but do not crash - nobody sees background-task exceptions (§5)
        logger.exception("Failed to send confirmation email to %s", email)


def _send_update_email(full_name: str, email: str, role: str) -> None:
    """Runs after details are updated."""
    try:
        resend.Emails.send({
            "from": f"ALIMERIQ <waitlist@{DOMAIN}>",
            "to": [email],
            "subject": "Your ALIMERIQ waitlist details have been updated 🎉",
            "html": _build_email_html(full_name, email, role),
        })
        logger.info("Update confirmation email sent to %s", email)
    except Exception:
        logger.exception("Failed to send update email to %s", email)


def _send_otp_email(email: str, otp_code: str) -> None:
    """Send OTP code via email for verification."""
    try:
        year = datetime.now(timezone.utc).year
        html = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ALIMERIQ OTP</title></head>
<body style="margin:0;padding:0;background:#0A0A0B;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0A0B;padding:40px 0;">
<tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0"
         style="background:#141417;border:1px solid #2B2B31;border-radius:16px;overflow:hidden;max-width:95%;">
    <tr><td style="padding:36px 40px 28px;border-bottom:1px solid #2B2B31;text-align:center;">
            <div style="display:inline-block;color:#F2CA50;font-family:Georgia,serif;font-size:38px;font-weight:700;line-height:40px;opacity:1;">A</div>
            <p style="margin:10px 0 0;font-size:11px;letter-spacing:3px;color:#F2CA50;font-weight:700;opacity:1;">ALIMERIQ</p>
    </td></tr>
    <tr><td style="padding:36px 40px;">
      <h1 style="margin:0 0 8px;font-size:26px;color:#F3F1EC;font-weight:600;line-height:1.25;">
        Verify Your Email
      </h1>
      <p style="margin:0 0 24px;font-size:14px;color:#9B9A94;line-height:1.7;">
        We received a request to update your ALIMERIQ waitlist details. Use the code below to verify your email address.
      </p>
      <div style="background:rgba(201,161,90,0.08);border:1px solid #C9A15A;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 12px;font-size:12px;color:#9B9A94;letter-spacing:1px;">YOUR VERIFICATION CODE</p>
        <p style="margin:0;font-size:32px;font-weight:700;color:#F2CA50;letter-spacing:4px;font-family:monospace;">{otp_code}</p>
        <p style="margin:12px 0 0;font-size:11px;color:#5F5E5A;">This code expires in 10 minutes</p>
      </div>
      <p style="margin:0 0 14px;font-size:12px;color:#9B9A94;line-height:1.6;">
        If you didn't request this, you can safely ignore this email. Your account remains secure.
      </p>
    </td></tr>
    <tr><td style="padding:24px 40px;border-top:1px solid #2B2B31;text-align:center;">
      <p style="margin:0;font-size:11px;color:#5F5E5A;line-height:1.6;">
        &copy; {year} ALIMERIQ &nbsp;|&nbsp;
        <a href="https://{DOMAIN}" style="color:#9B9A94;text-decoration:none;">{DOMAIN}</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""
        resend.Emails.send({
            "from": f"ALIMERIQ <waitlist@{DOMAIN}>",
            "to": [email],
            "subject": "Your ALIMERIQ verification code",
            "html": html,
        })
        logger.info("OTP email sent to %s", email)
    except Exception:
        logger.exception("Failed to send OTP email to %s", email)


# ── public service API ────────────────────────────────────────────────────────
async def join_waitlist(
    full_name: str,
    email: str,
    role: str,
    background_tasks: BackgroundTasks,
) -> dict:
    """
    §14 Canonical create flow:
      1. Check existing record
      2. If duplicate, distinguish same details vs different details
      3. Persist to DB if new
      4. Schedule email in background
      5. Return immediately
    """
    normalized_email = email.lower().strip()
    clean_name = " ".join(full_name.strip().split())
    clean_role = role.strip()

    existing = await repo.get_by_email(normalized_email)
    if existing:
        is_same = (
            existing.full_name.strip().lower() == clean_name.lower()
            and existing.role.strip().lower() == clean_role.lower()
        )
        if is_same:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_REGISTERED_SAME",
                    "message": "You are already registered on the waitlist.",
                    "existing": {
                        "full_name": existing.full_name,
                        "email": existing.email,
                        "role": existing.role,
                    },
                },
            )
        else:
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "ALREADY_REGISTERED_DIFFERENT",
                    "message": f"This email is already registered as {existing.role} ({existing.full_name}).",
                    "existing": {
                        "full_name": existing.full_name,
                        "email": existing.email,
                        "role": existing.role,
                    },
                },
            )

    try:
        await repo.create_entry(clean_name, normalized_email, clean_role)
    except Exception as exc:
        if isinstance(exc, IntegrityError) or "unique" in str(exc).lower():
            existing = await repo.get_by_email(normalized_email)
            if existing:
                is_same = (
                    existing.full_name.strip().lower() == clean_name.lower()
                    and existing.role.strip().lower() == clean_role.lower()
                )
                code = "ALREADY_REGISTERED_SAME" if is_same else "ALREADY_REGISTERED_DIFFERENT"
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": code,
                        "message": "You are already registered on the waitlist." if is_same else f"This email is already registered as {existing.role} ({existing.full_name}).",
                        "existing": {
                            "full_name": existing.full_name,
                            "email": existing.email,
                            "role": existing.role,
                        },
                    },
                )
            raise HTTPException(status_code=409, detail="This email is already on the waitlist.")
        raise

    # §5: pass primitives, not ORM objects; task is idempotent, logs its own errors
    background_tasks.add_task(_send_confirmation_email, clean_name, normalized_email, clean_role)

    return {"message": "Successfully joined the waitlist!"}


async def update_waitlist(
    full_name: str,
    email: str,
    role: str,
    background_tasks: BackgroundTasks,
    otp_code: str | None = None,
    verification_token: str | None = None,
) -> dict:
    """Update existing waitlist record details after verifying OTP or verification token."""
    normalized_email = email.lower().strip()
    clean_name = " ".join(full_name.strip().split())
    clean_role = role.strip()

    existing = await repo.get_by_email(normalized_email)
    if not existing:
        raise HTTPException(status_code=404, detail="No waitlist entry found with this email.")

    authorized = False
    if verification_token:
        payload = decode_access_token(verification_token)
        if (
            payload
            and payload.get("sub") == normalized_email
            and payload.get("purpose") == "waitlist_update"
        ):
            authorized = True

    if not authorized and otp_code:
        clean_otp = otp_code.strip()
        if len(clean_otp) == 6 and clean_otp.isdigit():
            if await repo.verify_otp(normalized_email, clean_otp):
                authorized = True

    if not authorized:
        raise HTTPException(
            status_code=401,
            detail="Verification required. Please provide a valid OTP or verification token to update waitlist details.",
        )

    updated = await repo.update_entry(
        email=normalized_email,
        full_name=clean_name,
        role=clean_role,
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update waitlist entry.")

    background_tasks.add_task(_send_update_email, clean_name, normalized_email, clean_role)
    return {"message": "Waitlist details successfully updated!"}


async def request_otp(email: str, background_tasks: BackgroundTasks) -> dict:
    """Generate and send OTP to email for verification."""
    normalized_email = email.lower().strip()
    
    existing = await repo.get_by_email(normalized_email)
    if not existing:
        raise HTTPException(status_code=404, detail="No waitlist entry found with this email.")
    
    otp_code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await repo.set_otp(normalized_email, otp_code, expires_at)
    background_tasks.add_task(_send_otp_email, normalized_email, otp_code)
    
    logger.info("OTP requested for email %s", normalized_email)
    return {"message": "OTP sent to your email. Valid for 10 minutes."}


async def verify_otp(email: str, otp_code: str) -> dict:
    """Verify OTP code for email and issue verification token."""
    normalized_email = email.lower().strip()
    clean_otp = otp_code.strip()
    
    if len(clean_otp) != 6 or not clean_otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid OTP format.")
    
    is_valid = await repo.verify_otp(normalized_email, clean_otp)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP.")
    
    token = create_access_token(
        data={"sub": normalized_email, "purpose": "waitlist_update"},
        expires_delta=timedelta(minutes=15),
    )

    logger.info("OTP verified for email %s", normalized_email)
    return {
        "message": "Email verified successfully.",
        "verified": True,
        "verification_token": token,
    }

