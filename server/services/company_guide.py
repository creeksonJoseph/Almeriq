"""services/company_guide.py - Company registration guide AI generation and DB caching service."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from core.gemini import clean_gemini_error, request_gemini_json
from repositories.company_guide import get_guide_by_country, save_guide
from services.founder_prompts import VOICE_AND_STYLE_GUIDELINES

logger = logging.getLogger(__name__)


def get_company_registration_prompt(country_name: str) -> str:
    """Construct AI prompt for country-specific company registration breakdown in plain, simple English."""
    return f"""You are a friendly, experienced startup advisor.
Explain step-by-step how a founder registers a new limited liability company or startup in {country_name}.
Write in simple, everyday English so even a 16-year-old high school student starting their first business can easily understand every word.

{VOICE_AND_STYLE_GUIDELINES}

CRITICAL RULES:
- Never use em dashes (—) or en dashes (–).
- Use simple punctuation: periods, commas, and question marks. Only use hyphens (-) when really needed.
- Avoid heavy legal words. Explain everything simply and clearly.

Return ONLY a valid JSON object matching this schema:
{{
  "country_name": "{country_name.strip().title()}",
  "regulatory_body": "Official Government Registry Name (like Business Registration Service, Companies House, or Corporate Affairs Commission)",
  "portal_url": "Official online portal URL (for example https://www.brs.go.ke)",
  "estimated_timeline": "Realistic turnaround (for example '3 to 5 business days')",
  "estimated_cost": "Estimated government fees in local currency and approx USD (for example 'KES 10,650 (about $82 USD)')",
  "prerequisites": [
    "3 proposed company names in order of preference",
    "Copies of national ID or passport for all founders",
    "Tax identification number for each founder",
    "Passport photos of each founder",
    "Physical address and postal address for the company office"
  ],
  "steps": [
    {{
      "step_number": 1,
      "title": "Name Search & Reservation",
      "description": "How the founder applies for name reservation, what rules apply, and how long name holds are valid.",
      "requirements": "Proposed company names, statutory name search fee",
      "online_process": "Fully Online via official portal"
    }},
    {{
      "step_number": 2,
      "title": "Draft Articles of Association & Statutory Details",
      "description": "Specifying share capital, initial share distribution, director particulars, and principal business activities.",
      "requirements": "Director consent, share allocation table, registered office details",
      "online_process": "Online or standard legal templates"
    }},
    {{
      "step_number": 3,
      "title": "Submit Statutory Incorporation Application",
      "description": "Upload founder ID copies, fill out the basic company forms, and pay the government registration fee online.",
      "requirements": "ID copies and online payment",
      "online_process": "Online through official portal"
    }},
    {{
      "step_number": 4,
      "title": "Get Your Certificate of Incorporation",
      "description": "The registry approves your application and gives you your official Certificate of Incorporation and company status document.",
      "requirements": "Application approval message",
      "online_process": "Download directly from the registry portal"
    }}
  ],
  "common_pitfalls": [
    "Submitting a name that is already taken by another registered business",
    "Names on your ID card not matching your tax registration details exactly",
    "Forgetting to submit the list of company owners and directors"
  ],
  "post_registration": [
    "Get your official company tax PIN from the revenue authority",
    "Open a dedicated business bank account using your certificate",
    "Get your local business permit from the city or county council",
    "Register for worker benefits if you plan to hire full-time staff"
  ]
}}

Ensure all steps are realistic, factual, sequential, and tailored specifically to {country_name}.
"""


async def get_or_create_company_guide(country_name: str, force_refresh: bool = False) -> tuple[dict[str, Any], str]:
    """
    Retrieve company registration guide for a country.
    First checks database cache. If missing (or force_refresh=True), calls Gemini AI,
    persists result in database, and returns it.
    """
    cleaned_country = country_name.strip()
    if not cleaned_country:
        cleaned_country = "Kenya"

    norm_country = cleaned_country.lower()

    # 1. Check database cache first
    if not force_refresh:
        cached = await get_guide_by_country(norm_country)
        if cached:
            logger.info(f"Serving company registration guide for '{cleaned_country}' from DATABASE cache.")
            return cached, "database"

    # 2. Not cached: Generate with AI
    logger.info(f"Generating company registration guide for '{cleaned_country}' via AI (first search or refresh)...")
    prompt = get_company_registration_prompt(cleaned_country)

    try:
        data = await asyncio.to_thread(
            request_gemini_json,
            prompt,
            timeout=30,
            context_tag=f"company_reg_guide_{norm_country}",
        )
    except Exception as exc:
        logger.error(
            f"Failed to generate company registration guide for {cleaned_country}: {str(exc)}",
            exc_info=True,
        )
        # If refresh failed but we had an existing cached version, fall back to it
        if force_refresh:
            cached = await get_guide_by_country(norm_country)
            if cached:
                return cached, "database_fallback"
        raise ValueError(clean_gemini_error(str(exc))) from exc

    # 3. Format and validate AI output
    guide_record = {
        "country": norm_country,
        "country_name": data.get("country_name") or cleaned_country.title(),
        "regulatory_body": data.get("regulatory_body") or "Department of Registrar of Companies",
        "portal_url": data.get("portal_url"),
        "estimated_timeline": data.get("estimated_timeline") or "3-7 business days",
        "estimated_cost": data.get("estimated_cost") or "Standard government filing fees",
        "prerequisites": data.get("prerequisites", []),
        "steps": data.get("steps", []),
        "common_pitfalls": data.get("common_pitfalls", []),
        "post_registration": data.get("post_registration", []),
        "source": "ai",
    }

    # 4. Save into database for all future users
    try:
        saved = await save_guide(guide_record)
        logger.info(f"Successfully cached company registration guide for '{cleaned_country}' into DATABASE.")
        return saved, "ai"
    except Exception as exc:
        logger.warning(f"Could not persist company guide for {cleaned_country} to DB: {exc}")
        return guide_record, "ai_transient"
