"""services/founder.py - Founder analysis orchestration and Gemini integration."""
from __future__ import annotations

import asyncio
import json
import logging
import time
import urllib.error
import urllib.request

from core.config import GEMINI_API_KEY, GEMINI_MODEL
from schemas.founder import FounderAnalysisRequest, FounderAnalysisResponse

logger = logging.getLogger(__name__)


def clean_gemini_error(error_message: str) -> str:
    """Convert technical Gemini errors to user-friendly messages."""
    error_lower = error_message.lower()
    
    if "429" in error_message or "quota" in error_lower or "rate" in error_lower:
        return "Service is busy. Please try again in 30 seconds."
    if "timeout" in error_lower or "timed out" in error_lower:
        return "Analysis took too long. Please try again."
    if "json" in error_lower or "parse" in error_lower:
        return "Unable to parse analysis. Please try again."
    if "connection" in error_lower or "refused" in error_lower:
        return "Connection failed. Please check your internet and try again."
    if "invalid" in error_lower or "malformed" in error_lower:
        return "Invalid response from AI. Please try again."
    if "400" in error_message:
        return "Invalid request format. Please try again."
    if "401" in error_message or "403" in error_message:
        return "Authentication error. Please contact support."
    if "500" in error_message or "502" in error_message or "503" in error_message:
        return "AI service error. Please try again later."
    
    return "Unable to complete analysis. Please try again."


def _parse_model_response(text: str) -> FounderAnalysisResponse:
    """Parse and validate Gemini JSON response."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    
    data = json.loads(cleaned)
    
    return FounderAnalysisResponse(
        source="gemini",
        summary=str(data.get("summary", "")),
        market=str(data.get("market", "")),
        risks=[str(item) for item in data.get("risks", [])][:7],
        mvp=[str(item) for item in data.get("mvp", [])][:7],
        roadmap=[str(item) for item in data.get("roadmap", [])][:8],
        next_steps=[str(item) for item in data.get("next_steps", [])][:8],
    )


def _request_gemini(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    """Request analysis from Gemini API."""
    start_time = time.time()
    logger.info(
        "Starting Gemini analysis request",
        extra={
            "idea_length": len(payload.idea),
            "problem_length": len(payload.problem),
            "solution_length": len(payload.solution),
            "customer": payload.customer,
            "location": payload.location,
        }
    )
    
    prompt = f"""Analyze this startup idea and return JSON.
Keys: summary, market, risks (array), mvp (array), roadmap (array), next_steps (array).

Idea: {payload.idea}
Problem: {payload.problem}
Solution: {payload.solution}
Customer: {payload.customer}
Location: {payload.location}"""

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
    
    logger.debug(f"Gemini API URL: {url}")
    logger.debug(f"Request payload size: {len(body)} bytes")
    
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY,
        },
        method="POST",
    )
    
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
        
        elapsed = time.time() - start_time
        logger.info(
            "Gemini analysis completed successfully",
            extra={"elapsed_seconds": round(elapsed, 2)}
        )
        
        text = result["candidates"][0]["content"]["parts"][0]["text"]
        return _parse_model_response(text)
    
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini HTTP error: {e.code} {e.reason}",
            extra={
                "status_code": e.code,
                "reason": e.reason,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        error_msg = f"HTTP {e.code}: {e.reason}"
        raise ValueError(clean_gemini_error(error_msg)) from e
    
    except urllib.error.URLError as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini connection error: {str(e)}",
            extra={"elapsed_seconds": round(elapsed, 2)}
        )
        raise ValueError(clean_gemini_error(str(e))) from e
    
    except TimeoutError as e:
        elapsed = time.time() - start_time
        logger.error(
            "Gemini request timeout",
            extra={"elapsed_seconds": round(elapsed, 2)}
        )
        raise ValueError(clean_gemini_error("Request timeout")) from e
    
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini response parsing error: {str(e)}",
            extra={
                "error_type": type(e).__name__,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        raise ValueError(clean_gemini_error(f"Invalid response format: {str(e)}")) from e


async def analyze_founder_idea(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    """Analyze founder idea using Gemini AI. No fallback - errors are raised."""
    logger.info("analyze_founder_idea called")
    
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured")
        raise ValueError("AI service not configured. Please contact support.")
    
    try:
        return await asyncio.to_thread(_request_gemini, payload)
    except ValueError as e:
        logger.warning(f"Cleaned error returned to user: {str(e)}")
        raise  # Re-raise cleaned errors
    except Exception as exc:
        logger.error(
            f"Unexpected error in founder analysis: {str(exc)}",
            extra={"error_type": type(exc).__name__},
            exc_info=True
        )
        raise ValueError(clean_gemini_error(str(exc))) from exc


# ── Individual AI Tools ────────────────────────────────────────────────────────

def _get_tool_prompt(tool_key: str, payload) -> str:
    """Generate tool-specific prompts to avoid HTTP 400 errors."""
    idea = payload.idea
    customer = payload.customer or "target customers"
    location = payload.location or "global market"
    problem = payload.problem or ""
    solution = payload.solution or ""

    if tool_key == "lean_canvas":
        return f"Create a Lean Canvas for: {idea}. Customer: {customer}. Problem: {problem}. Solution: {solution}. Return JSON with: problem, customer_segments, unique_value_prop, solution, channels, revenue_streams, cost_structure, key_metrics, unfair_advantage."

    if tool_key == "swot":
        return f"SWOT analysis for {idea} targeting {customer} in {location}. Return JSON with: strengths, weaknesses, opportunities, threats (each as array of 3 strings)."

    if tool_key == "pitch_deck":
        return f"Create 10-slide pitch deck outline for {idea}. Customer: {customer}. Return JSON with slides array (slide_number, title, bullets, speaker_notes)."

    if tool_key == "financial_model":
        return f"Financial model for {idea} with {customer} in {location}. Return JSON with: currency, assumptions, revenue_drivers, cost_drivers, projections_summary, break_even_units, unit_economics."

    if tool_key == "risk_matrix":
        return f"Risk matrix for {idea}. Return JSON with risks array (category, risk, likelihood, impact, mitigation)."

    if tool_key == "user_personas":
        return f"User personas for {idea} targeting {customer}. Return JSON with personas array (name, role, quote, goals, pain_points)."

    if tool_key == "user_journey":
        return f"User journey for {idea}. Return JSON with steps array (stage, user_action, emotion, touchpoint, opportunity)."

    if tool_key == "tech_stack":
        return f"Tech stack for {idea}. Return JSON with: frontend, backend, database, infrastructure, third_party_services, rationale."

    if tool_key == "sprint_backlog":
        return f"MVP sprint backlog for {idea}. Return JSON with mvp_epics array (epic, user_stories, priority, estimate)."

    if tool_key == "investor_update":
        return f"Monthly investor update for {idea}. Return JSON with: subject, highlights, lowlights, kpis, asks, full_email."

    if tool_key == "job_post":
        return f"Job posting for {idea}. Return JSON with: title, role_summary, responsibilities, requirements, why_join_us."

    return f"Generate {tool_key} for {idea}."


def _request_gemini_tool(payload) -> dict:
    """Request tool deliverable from Gemini API."""
    start_time = time.time()
    logger.info(
        f"Starting Gemini tool request: {payload.tool_key}",
        extra={
            "tool_key": payload.tool_key,
            "idea_length": len(payload.idea),
        }
    )
    
    prompt = _get_tool_prompt(payload.tool_key, payload)
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY},
        method="POST",
    )
    
    logger.debug(f"Tool request payload size: {len(body)} bytes")
    
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
        
        elapsed = time.time() - start_time
        logger.info(
            f"Gemini tool request completed: {payload.tool_key}",
            extra={
                "tool_key": payload.tool_key,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        
        text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
        return json.loads(text)
    
    except urllib.error.HTTPError as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini tool HTTP error: {e.code} {e.reason}",
            extra={
                "tool_key": payload.tool_key,
                "status_code": e.code,
                "reason": e.reason,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        error_msg = f"HTTP {e.code}: {e.reason}"
        raise ValueError(clean_gemini_error(error_msg)) from e
    
    except urllib.error.URLError as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini tool connection error: {str(e)}",
            extra={
                "tool_key": payload.tool_key,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        raise ValueError(clean_gemini_error(str(e))) from e
    
    except TimeoutError as e:
        elapsed = time.time() - start_time
        logger.error(
            "Gemini tool request timeout",
            extra={
                "tool_key": payload.tool_key,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        raise ValueError(clean_gemini_error("Request timeout")) from e
    
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        elapsed = time.time() - start_time
        logger.error(
            f"Gemini tool response parsing error: {str(e)}",
            extra={
                "tool_key": payload.tool_key,
                "error_type": type(e).__name__,
                "elapsed_seconds": round(elapsed, 2),
            }
        )
        raise ValueError(clean_gemini_error(f"Invalid response format: {str(e)}")) from e


async def generate_tool_deliverable(payload) -> tuple[dict, str]:
    """Generate tool deliverable using Gemini AI. No fallback - errors are raised."""
    logger.info(f"generate_tool_deliverable called for: {payload.tool_key}")
    
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured for tool generation")
        raise ValueError("AI service not configured. Please contact support.")
    
    try:
        data = await asyncio.to_thread(_request_gemini_tool, payload)
        logger.info(f"Tool deliverable generated successfully: {payload.tool_key}")
        return data, "gemini"
    except ValueError as e:
        logger.warning(f"Cleaned error for tool {payload.tool_key}: {str(e)}")
        raise  # Re-raise cleaned errors
    except Exception as exc:
        logger.error(
            f"Unexpected error in tool generation for {payload.tool_key}: {str(exc)}",
            extra={
                "tool_key": payload.tool_key,
                "error_type": type(exc).__name__,
            },
            exc_info=True
        )
        raise ValueError(clean_gemini_error(str(exc))) from exc
