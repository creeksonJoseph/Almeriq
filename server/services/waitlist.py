"""services/waitlist.py - business logic and side-effect orchestration.

Principle §1: persist first, return 201, then do expensive side effects
(email send) in a background task. The router passes a BackgroundTasks
handle; the service schedules the email task and returns immediately.
"""
from __future__ import annotations
import logging

from sqlalchemy.exc import IntegrityError
import resend
from fastapi import BackgroundTasks, HTTPException

from core.config import DOMAIN, RESEND_API_KEY
from repositories import waitlist as repo

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
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <polygon points="20,2 37,20 20,38 3,20" fill="none" stroke="#C9A15A" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-size="16" fill="#C9A15A" font-family="Georgia,serif">A</text>
      </svg>
      <p style="margin:10px 0 0;font-size:11px;letter-spacing:3px;color:#C9A15A;font-weight:700;">ALIMERIQ</p>
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
) -> dict:
    """Update existing waitlist record details."""
    normalized_email = email.lower().strip()
    clean_name = " ".join(full_name.strip().split())
    clean_role = role.strip()

    existing = await repo.get_by_email(normalized_email)
    if not existing:
        raise HTTPException(status_code=404, detail="No waitlist entry found with this email.")

    updated = await repo.update_entry(
        email=normalized_email,
        full_name=clean_name,
        role=clean_role,
    )
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update waitlist entry.")

    background_tasks.add_task(_send_update_email, clean_name, normalized_email, clean_role)
    return {"message": "Waitlist details successfully updated!"}
