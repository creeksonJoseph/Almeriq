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


def _get_candidate_models() -> list[str]:
    """Return ordered list of models to try, prioritizing configured model and falling back to fast alternatives."""
    models = [GEMINI_MODEL] if GEMINI_MODEL else []
    for fallback in ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-flash-latest"]:
        if fallback not in models:
            models.append(fallback)
    return models


def _request_gemini(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    """Request analysis from Gemini API with automatic fallback if a model is unavailable or times out."""
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

    models = _get_candidate_models()
    last_exception = None

    for idx, model_name in enumerate(models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        logger.debug(f"Attempting Gemini request with {model_name}: {url}")
        
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
            with urllib.request.urlopen(request, timeout=20) as response:
                result = json.loads(response.read().decode("utf-8"))
            
            elapsed = time.time() - start_time
            logger.info(
                f"Gemini analysis completed successfully using {model_name}",
                extra={"elapsed_seconds": round(elapsed, 2), "model": model_name}
            )
            
            text = result["candidates"][0]["content"]["parts"][0]["text"]
            return _parse_model_response(text)
        
        except urllib.error.HTTPError as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini HTTP error with {model_name}: {e.code} {e.reason}",
                extra={
                    "model": model_name,
                    "status_code": e.code,
                    "reason": e.reason,
                    "elapsed_seconds": round(elapsed, 2),
                }
            )
            last_exception = e
            # Retry on 503 (high demand), 429 (rate/quota), 500, 502, 504 if another model is available
            if e.code in (503, 429, 500, 502, 504) and idx < len(models) - 1:
                logger.info(f"Retrying analysis with fallback model: {models[idx + 1]}")
                continue
            error_msg = f"HTTP {e.code}: {e.reason}"
            raise ValueError(clean_gemini_error(error_msg)) from e
        
        except (urllib.error.URLError, TimeoutError, Exception) as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini request failed with {model_name}: {str(e)}",
                extra={"model": model_name, "elapsed_seconds": round(elapsed, 2)}
            )
            last_exception = e
            if idx < len(models) - 1:
                logger.info(f"Retrying analysis with fallback model: {models[idx + 1]}")
                continue
            raise ValueError(clean_gemini_error(str(e))) from e

    raise ValueError(clean_gemini_error(str(last_exception) if last_exception else "Service unavailable"))


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

    if tool_key == "market_analysis":
        return (
            f"You are a senior market research analyst. Produce a comprehensive market analysis for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"Return JSON with these keys:\n"
            f"  market_overview (string, 2-3 sentences on the market landscape),\n"
            f"  market_size (object: tam string, sam string, som string, each with a numeric estimate and explanation),\n"
            f"  target_segments (array of objects: segment string, size_estimate string, pain_level string 1-10, willingness_to_pay string),\n"
            f"  competitive_landscape (array of objects: competitor string, strengths array, weaknesses array, market_share_estimate string),\n"
            f"  market_trends (array of 4-6 strings describing current and emerging trends),\n"
            f"  entry_barriers (array of 3-5 strings),\n"
            f"  go_to_market_channels (array of objects: channel string, rationale string, estimated_cost_to_acquire string),\n"
            f"  differentiation_opportunity (string, 2-3 sentences),\n"
            f"  key_risks (array of 3-5 strings),\n"
            f"  verdict (string: one of 'Strong Opportunity', 'Moderate Opportunity', 'Niche Opportunity', 'Challenging Market'),\n"
            f"  verdict_rationale (string, 1-2 sentences)."
        )

    if tool_key == "feasibility_analysis":
        return (
            f"You are a startup feasibility expert. Produce a thorough feasibility analysis for this startup idea.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"Return JSON with these keys:\n"
            f"  overall_feasibility_score (integer 1-10),\n"
            f"  overall_feasibility_verdict (string: one of 'Highly Feasible', 'Feasible with Effort', 'Feasible with Pivots', 'Low Feasibility'),\n"
            f"  executive_summary (string, 2-3 sentences),\n"
            f"  dimensions (array of objects: dimension string, score integer 1-10, assessment string, risks array of strings, recommendations array of strings) — cover: Technical Feasibility, Market Feasibility, Financial Feasibility, Operational Feasibility, Legal & Regulatory Feasibility,\n"
            f"  critical_success_factors (array of 4-6 strings),\n"
            f"  critical_failure_risks (array of 4-6 strings),\n"
            f"  resource_requirements (object: team array of strings, technology array of strings, capital_estimate string, timeline_to_mvp string),\n"
            f"  recommended_next_steps (array of 4-6 strings ordered by priority),\n"
            f"  pivot_options (array of 2-3 objects: pivot string, rationale string)."
        )

    if tool_key == "business_plan":
        return (
            f"You are a seasoned business strategy consultant. Write a production-grade business plan for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"Return JSON with these keys:\n"
            f"  executive_summary (string),\n"
            f"  problem_statement (string),\n"
            f"  solution_description (string),\n"
            f"  value_proposition (string, one clear sentence),\n"
            f"  target_market (object: primary_segment string, secondary_segment string, market_size_estimate string),\n"
            f"  business_model (object: revenue_streams array of objects with stream and description, pricing_strategy string, unit_economics object with cac_estimate and ltv_estimate),\n"
            f"  product_service_overview (object: core_features array of strings, mvp_scope string, roadmap_phases array of objects with phase and deliverables array),\n"
            f"  marketing_strategy (object: positioning string, channels array of strings, acquisition_strategy string, retention_strategy string),\n"
            f"  operations_plan (object: team_structure array of strings, key_processes array of strings, technology_stack string, partnerships array of strings),\n"
            f"  financial_projections (object: assumptions array of strings, year1_revenue_estimate string, year2_revenue_estimate string, year3_revenue_estimate string, break_even_timeline string, funding_required string),\n"
            f"  risk_mitigation (array of objects: risk string, mitigation string),\n"
            f"  milestones (array of objects: milestone string, target_date string, success_metric string)."
        )

    if tool_key == "execution_roadmap":
        return (
            f"You are a product and operations expert. Create a detailed execution roadmap for this startup.\n"
            f"Idea: {idea}\nProblem: {problem}\nSolution: {solution}\nCustomer: {customer}\nLocation: {location}\n\n"
            f"Return JSON with these keys:\n"
            f"  summary (string, 1-2 sentences),\n"
            f"  phases (array of exactly 4 objects representing: Foundation (0-30 days), Build (30-90 days), Launch (90-180 days), Scale (180-365 days) — each object has: phase string, duration string, objective string, key_activities array of 4-6 strings, deliverables array of 3-5 strings, success_metrics array of 3-4 strings, resources_needed array of strings, risks array of strings),\n"
            f"  critical_path (array of 5-8 strings — the must-do items in order),\n"
            f"  team_hiring_plan (array of objects: role string, when_to_hire string, priority string one of High/Medium/Low),\n"
            f"  budget_allocation (array of objects: category string, percentage integer, notes string) — must sum to 100,\n"
            f"  kpis (array of objects: metric string, target string, measurement_frequency string),\n"
            f"  quick_wins (array of 3-5 strings — things achievable in first 2 weeks)."
        )

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
    
    models = _get_candidate_models()
    last_exception = None

    for idx, model_name in enumerate(models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        request = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", "X-goog-api-key": GEMINI_API_KEY},
            method="POST",
        )
        
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                result = json.loads(response.read().decode("utf-8"))
            
            elapsed = time.time() - start_time
            logger.info(
                f"Gemini tool request completed: {payload.tool_key} using {model_name}",
                extra={
                    "tool_key": payload.tool_key,
                    "model": model_name,
                    "elapsed_seconds": round(elapsed, 2),
                }
            )
            
            text = result["candidates"][0]["content"]["parts"][0]["text"].strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
            return json.loads(text)
        
        except urllib.error.HTTPError as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini tool HTTP error with {model_name}: {e.code} {e.reason}",
                extra={
                    "tool_key": payload.tool_key,
                    "model": model_name,
                    "status_code": e.code,
                    "reason": e.reason,
                    "elapsed_seconds": round(elapsed, 2),
                }
            )
            last_exception = e
            if e.code in (503, 429, 500, 502, 504) and idx < len(models) - 1:
                logger.info(f"Retrying tool request with fallback model: {models[idx + 1]}")
                continue
            error_msg = f"HTTP {e.code}: {e.reason}"
            raise ValueError(clean_gemini_error(error_msg)) from e
        
        except (urllib.error.URLError, TimeoutError, Exception) as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini tool connection/timeout error with {model_name}: {str(e)}",
                extra={
                    "tool_key": payload.tool_key,
                    "model": model_name,
                    "elapsed_seconds": round(elapsed, 2),
                }
            )
            last_exception = e
            if idx < len(models) - 1:
                logger.info(f"Retrying tool request with fallback model: {models[idx + 1]}")
                continue
            raise ValueError(clean_gemini_error(str(e))) from e

    raise ValueError(clean_gemini_error(str(last_exception) if last_exception else "Service unavailable"))


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
