"""services/founder.py - Founder analysis orchestration and Gemini integration."""
from __future__ import annotations

import asyncio
import json
import logging
import urllib.error
import urllib.request

from core.config import GEMINI_API_KEY, GEMINI_MODEL
from schemas.founder import FounderAnalysisRequest, FounderAnalysisResponse

logger = logging.getLogger(__name__)


def _fallback_analysis(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    return FounderAnalysisResponse(
        source="local",
        summary=(
            f"{payload.idea.strip()} has a clear starting point for {payload.customer.strip()} "
            f"in {payload.location.strip()}. Validate the customer problem before expanding scope."
        ),
        market=(
            f"Start with interviews and a small pilot among {payload.customer.strip()} in "
            f"{payload.location.strip()}. Measure willingness to pay, repeat usage, and the "
            "cost of reaching each customer."
        ),
        risks=[
            "The problem may be inconvenient rather than urgent for the target customer.",
            "The first solution scope may be too broad to validate quickly.",
            "Acquisition costs and operational constraints are not yet proven.",
        ],
        mvp=[
            "One focused workflow that delivers the core outcome.",
            "A lightweight onboarding and feedback loop.",
            "A small pilot with measurable success criteria.",
        ],
        roadmap=[
            "Week 1-2: interview target customers and document repeated pain points.",
            "Week 3-6: build the smallest testable version of the solution.",
            "Week 7-8: run a pilot, measure outcomes, and decide what to improve.",
        ],
        next_steps=[
            "Schedule 10 customer discovery conversations.",
            "Write a one-page pilot offer with a measurable outcome.",
            "Choose one metric that proves the problem is worth solving.",
        ],
    )


def _parse_model_response(text: str) -> FounderAnalysisResponse:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    data = json.loads(cleaned)
    return FounderAnalysisResponse(
        source="gemini",
        summary=str(data["summary"]),
        market=str(data["market"]),
        risks=[str(item) for item in data["risks"]][:5],
        mvp=[str(item) for item in data["mvp"]][:5],
        roadmap=[str(item) for item in data["roadmap"]][:5],
        next_steps=[str(item) for item in data["next_steps"]][:5],
    )


def _request_gemini(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    prompt = f"""
You are Alimeriq's startup strategy analyst. Analyze this founder idea and return only valid JSON.
Use exactly these keys: summary (string), market (string), risks (array of 3 strings),
mvp (array of 3 strings), roadmap (array of 3 strings), next_steps (array of 3 strings).
Be specific, practical, concise, and do not invent market statistics.

Idea: {payload.idea}
Problem: {payload.problem}
Proposed solution: {payload.solution}
Target customer: {payload.customer}
Launch location: {payload.location}
""".strip()
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        result = json.loads(response.read().decode("utf-8"))
    text = result["candidates"][0]["content"]["parts"][0]["text"]
    return _parse_model_response(text)


async def analyze_founder_idea(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    if not GEMINI_API_KEY:
        return _fallback_analysis(payload)
    try:
        return await asyncio.to_thread(_request_gemini, payload)
    except (KeyError, TypeError, ValueError, urllib.error.URLError, TimeoutError) as exc:
        logger.warning("Gemini founder analysis failed; using local fallback: %s", exc)
        return _fallback_analysis(payload)
