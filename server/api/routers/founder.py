"""api/routers/founder.py - Authenticated founder workspace endpoints."""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, Depends, HTTPException, status

from api.dependencies import get_current_user
from repositories.founder_ai_cache import (
    compute_content_hash,
    get_cached_tool_result,
    save_cached_tool_result,
)
from repositories.founder_legal import create_filing, list_filings
from repositories.founder_validation import get_validation, upsert_validation
from repositories.founder_venture import (
    delete_venture,
    get_venture,
    list_ventures,
    save_venture,
    save_brief_only,
    update_venture_analysis,
)
from schemas.founder import (
    FounderAnalysisRequest,
    FounderAnalysisResponse,
    FounderBriefSaveRequest,
    FounderBriefSaveResponse,
    FounderLegalCreate,
    FounderLegalOut,
    FounderToolRequest,
    FounderToolResponse,
    FounderValidationOut,
    FounderValidationUpdate,
    VentureOut,
    CompanyRegistrationGuideOut,
)
from services.founder import analyze_founder_idea, generate_tool_deliverable
from services.company_guide import get_or_create_company_guide

logger = logging.getLogger(__name__)
router = APIRouter(tags=["founder"])

# ── helpers ───────────────────────────────────────────────────────────────────

def _require_founder(current_user: dict) -> int:
    if current_user.get("role") != "founder":
        logger.warning(
            f"Non-founder user attempted founder workspace access",
            extra={"user_id": current_user.get("id"), "role": current_user.get("role")}
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Founder workspace access requires the founder role.",
        )
    return int(current_user["id"])


# ── Save brief only (no AI) ──────────────────────────────────────────────────

@router.post("/founder/save-brief", response_model=FounderBriefSaveResponse, status_code=201)
@router.post("/api/founder/save-brief", response_model=FounderBriefSaveResponse, status_code=201)
async def save_brief(
    body: FounderBriefSaveRequest,
    current_user: dict = Depends(get_current_user),
) -> FounderBriefSaveResponse:
    """Save venture brief without triggering AI analysis. Returns venture_id for later analysis."""
    user_id = _require_founder(current_user)
    logger.info("POST /founder/save-brief", extra={"user_id": user_id, "idea_length": len(body.idea)})
    try:
        saved = await save_brief_only(user_id=user_id, brief=body.model_dump())
        return FounderBriefSaveResponse(venture_id=saved["id"], message="Brief saved.")
    except Exception as e:
        logger.error(f"Failed to save brief: {str(e)}", extra={"user_id": user_id}, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save venture brief. Please try again.")


# ── Analyze + auto-save ───────────────────────────────────────────────────────

@router.post("/founder/analyze", response_model=FounderAnalysisResponse, response_model_exclude_none=True)
@router.post("/api/founder/analyze", response_model=FounderAnalysisResponse, response_model_exclude_none=True)
async def analyze(
    body: FounderAnalysisRequest,
    current_user: dict = Depends(get_current_user),
) -> FounderAnalysisResponse:
    user_id = _require_founder(current_user)
    start_time = time.time()
    
    logger.info(
        "POST /founder/analyze",
        extra={
            "user_id": user_id,
            "idea_length": len(body.idea),
            "customer": body.customer,
            "location": body.location,
        }
    )
    
    try:
        result = await analyze_founder_idea(body)
        logger.info(
            "Analysis completed successfully",
            extra={
                "user_id": user_id,
                "elapsed_seconds": round(time.time() - start_time, 2),
                "source": result.source,
            }
        )
    except ValueError as e:
        logger.error(
            f"Analysis failed with cleaned error: {str(e)}",
            extra={
                "user_id": user_id,
                "elapsed_seconds": round(time.time() - start_time, 2),
            }
        )
        # Cleaned error from service
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(
            f"Unexpected error in analysis: {str(e)}",
            extra={
                "user_id": user_id,
                "error_type": type(e).__name__,
                "elapsed_seconds": round(time.time() - start_time, 2),
            },
            exc_info=True
        )
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to complete analysis. Please try again.",
        )

    # Persist automatically — fire and forget errors don't break the response
    try:
        saved = await save_venture(
            user_id=user_id,
            brief=body.model_dump(),
            analysis=result.model_dump(),
        )
        result.venture_id = saved["id"]
        logger.info(
            "Venture saved to database",
            extra={
                "user_id": user_id,
                "venture_id": saved["id"],
            }
        )
    except Exception as e:
        logger.warning(
            f"Failed to save venture to database: {str(e)}",
            extra={
                "user_id": user_id,
                "error_type": type(e).__name__,
            }
        )
        pass  # Analysis still returned even if DB write fails

    return result


# ── Venture history ───────────────────────────────────────────────────────────

@router.get("/founder/ventures", response_model=list[VentureOut])
@router.get("/api/founder/ventures", response_model=list[VentureOut])
async def ventures_list(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    user_id = _require_founder(current_user)
    logger.info("GET /founder/ventures", extra={"user_id": user_id})
    return await list_ventures(user_id)


@router.get("/founder/ventures/{venture_id}", response_model=VentureOut)
@router.get("/api/founder/ventures/{venture_id}", response_model=VentureOut)
async def venture_get(
    venture_id: int,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    logger.info(
        "GET /founder/ventures/{venture_id}",
        extra={"user_id": user_id, "venture_id": venture_id}
    )
    venture = await get_venture(venture_id, user_id)
    if not venture:
        logger.warning(
            "Venture not found",
            extra={"user_id": user_id, "venture_id": venture_id}
        )
        raise HTTPException(status_code=404, detail="Venture not found.")
    return venture


@router.delete("/founder/ventures/{venture_id}", status_code=204)
@router.delete("/api/founder/ventures/{venture_id}", status_code=204)
async def venture_delete(
    venture_id: int,
    current_user: dict = Depends(get_current_user),
) -> None:
    user_id = _require_founder(current_user)
    logger.info(
        "DELETE /founder/ventures/{venture_id}",
        extra={"user_id": user_id, "venture_id": venture_id}
    )
    deleted = await delete_venture(venture_id, user_id)
    if not deleted:
        logger.warning(
            "Venture not found for deletion",
            extra={"user_id": user_id, "venture_id": venture_id}
        )
        raise HTTPException(status_code=404, detail="Venture not found.")
    logger.info(
        "Venture deleted successfully",
        extra={"user_id": user_id, "venture_id": venture_id}
    )


# ── Idea Validation ───────────────────────────────────────────────────────────

@router.get("/founder/validation", response_model=FounderValidationOut)
@router.get("/api/founder/validation", response_model=FounderValidationOut)
async def validation_get(
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    logger.info("GET /founder/validation", extra={"user_id": user_id})
    return await get_validation(user_id)


@router.put("/founder/validation", response_model=FounderValidationOut)
@router.put("/api/founder/validation", response_model=FounderValidationOut)
@router.post("/founder/validation", response_model=FounderValidationOut)
@router.post("/api/founder/validation", response_model=FounderValidationOut)
async def validation_update(
    body: FounderValidationUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    logger.info(
        "POST/PUT /founder/validation",
        extra={
            "user_id": user_id,
            "dimensions_updated": len([v for v in body.model_dump().values() if v is not None]),
        }
    )
    dims = {k: v for k, v in body.model_dump().items() if v is not None}
    return await upsert_validation(user_id, dims)


# ── Legal Filings ─────────────────────────────────────────────────────────────

@router.get("/founder/legal", response_model=list[FounderLegalOut])
@router.get("/api/founder/legal", response_model=list[FounderLegalOut])
async def legal_list(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    user_id = _require_founder(current_user)
    logger.info("GET /founder/legal", extra={"user_id": user_id})
    return await list_filings(user_id)


@router.post("/founder/legal", response_model=FounderLegalOut)
@router.post("/api/founder/legal", response_model=FounderLegalOut)
async def legal_create(
    body: FounderLegalCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    logger.info(
        "POST /founder/legal",
        extra={
            "user_id": user_id,
            "filing_type": body.filing_type,
        }
    )
    return await create_filing(user_id, body.model_dump())


@router.get("/founder/legal/company-guide", response_model=CompanyRegistrationGuideOut)
@router.get("/api/founder/legal/company-guide", response_model=CompanyRegistrationGuideOut)
async def legal_company_guide(
    country: str | None = None,
    refresh: bool = False,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)

    target_country = (country or "").strip()
    if not target_country:
        target_country = (current_user.get("nationality") or "").strip()
    if not target_country:
        try:
            ventures = await list_ventures(user_id)
            if ventures and ventures[0].get("location"):
                target_country = ventures[0]["location"].strip()
        except Exception:
            pass
    if not target_country:
        target_country = "Kenya"

    logger.info(
        "GET /founder/legal/company-guide",
        extra={"user_id": user_id, "country": target_country, "refresh": refresh},
    )

    try:
        guide, source = await get_or_create_company_guide(target_country, force_refresh=refresh)
        return guide
    except Exception as exc:
        logger.error(f"Error getting company registration guide for '{target_country}': {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to generate the registration guide for {target_country}. Please retry.",
        ) from exc


# ── AI Tools Deliverables (with caching) ───────────────────────────────────────

def _extract_analysis_fields(tool_key: str, result: dict, source: str) -> dict:
    """Extract flat summary/market/risks/mvp/roadmap/next_steps from a structured tool result.
    This allows a pending venture to be updated with real analysis data."""
    fields = {"source": "analyzed"}

    if tool_key == "market_analysis":
        overview = result.get("market_overview", "")
        fields["summary"] = overview if isinstance(overview, str) else overview.get("summary", "")
        if not fields["summary"]:
            fields["summary"] = result.get("verdict_rationale", "")
            
        tam = (result.get("market_size") or {}).get("tam", "") if isinstance(result.get("market_size"), dict) else ""
        fields["market"] = result.get("differentiation_opportunity") or tam or fields["summary"]
        fields["risks"] = result.get("key_risks") or result.get("entry_barriers") or []
        channels = result.get("go_to_market_channels") or result.get("channels") or []
        fields["mvp"] = [ch.get("channel") if isinstance(ch, dict) else str(ch) for ch in channels[:5]]
        trends = result.get("market_trends") or result.get("trends") or []
        fields["roadmap"] = [t if isinstance(t, str) else str(t) for t in trends[:5]]
        segs = result.get("target_segments") or []
        fields["next_steps"] = [s.get("segment") if isinstance(s, dict) else str(s) for s in segs[:5]]

    elif tool_key == "feasibility_analysis":
        fields["summary"] = (
            result.get("executive_summary")
            or f"{result.get('overall_feasibility_verdict', 'Feasible')} (Score: {result.get('overall_feasibility_score', 8)}/10)"
        )
        fields["market"] = result.get("overall_feasibility_verdict", "") or fields["summary"]
        fields["risks"] = result.get("critical_failure_risks") or []
        fields["mvp"] = result.get("critical_success_factors") or []
        dims = result.get("dimensions") or []
        fields["roadmap"] = [f"{d.get('dimension')}: {d.get('score')}/10" for d in dims if isinstance(d, dict)]
        fields["next_steps"] = result.get("recommended_next_steps") or []

    elif tool_key == "business_plan":
        fields["summary"] = result.get("executive_summary") or result.get("value_proposition") or ""
        fields["market"] = result.get("value_proposition") or fields["summary"]
        fields["risks"] = [r.get("risk") for r in result.get("risk_mitigation", []) if isinstance(r, dict)]
        milestones = result.get("milestones") or []
        fields["mvp"] = [m.get("milestone") for m in milestones if isinstance(m, dict)][:5]
        fields["roadmap"] = [f"{m.get('milestone')} ({m.get('target_date', '')})" for m in milestones if isinstance(m, dict)][:5]
        fields["next_steps"] = [m.get("milestone") for m in milestones if isinstance(m, dict)][:5]

    elif tool_key == "execution_roadmap":
        fields["summary"] = result.get("executive_summary") or ""
        fields["market"] = fields["summary"]
        fields["risks"] = result.get("critical_path") or []
        phases = result.get("phases") or []
        fields["mvp"] = [p.get("goal") for p in phases if isinstance(p, dict)][:5]
        fields["roadmap"] = [f"{p.get('phase')}: {p.get('goal','')}" for p in phases if isinstance(p, dict)][:5]
        fields["next_steps"] = result.get("critical_path") or []

    elif tool_key in ("idea_validation", "validation_analysis"):
        fields["summary"] = result.get("executive_summary") or ""
        market_rubric = (result.get("rubric") or {}).get("market_size") or {}
        fields["market"] = market_rubric.get("sizing_rationale") or result.get("executive_summary", "")
        fields["risks"] = result.get("critical_red_flags") or []
        fields["mvp"] = result.get("top_strengths") or []
        fields["next_steps"] = result.get("immediate_action_plan") or []

    # Clean empty values
    for k in ("risks", "mvp", "roadmap", "next_steps"):
        fields[k] = [v for v in fields.get(k, []) if v]

    return fields


@router.post("/founder/ai-tools", response_model=FounderToolResponse)
@router.post("/api/founder/ai-tools", response_model=FounderToolResponse)
async def execute_tool(
    body: FounderToolRequest,
    current_user: dict = Depends(get_current_user),
) -> FounderToolResponse:
    user_id = _require_founder(current_user)
    start_time = time.time()
    
    logger.info(
        "POST /founder/ai-tools",
        extra={
            "user_id": user_id,
            "tool_key": body.tool_key,
            "idea_length": len(body.idea),
        }
    )
    
    chash = compute_content_hash({
        "tool_key": body.tool_key,
        "idea": body.idea,
        "customer": body.customer,
        "location": body.location,
        "problem": body.problem,
        "solution": body.solution,
    })

    # Check cache unless refresh requested
    force_refresh = bool(body.extra_params and body.extra_params.get("refresh"))
    if not force_refresh:
        cached = await get_cached_tool_result(user_id, body.tool_key, chash)
        if cached:
            logger.info(
                f"Tool result served from cache: {body.tool_key}",
                extra={
                    "user_id": user_id,
                    "tool_key": body.tool_key,
                    "elapsed_seconds": round(time.time() - start_time, 2),
                }
            )
            # Still update a pending venture if linked
            if body.venture_id:
                try:
                    venture = await get_venture(body.venture_id, user_id)
                    if venture and (venture.get("source") == "pending" or not venture.get("summary")):
                        analysis_update = _extract_analysis_fields(body.tool_key, cached, "cache")
                        await update_venture_analysis(body.venture_id, user_id, analysis_update)
                except Exception:
                    pass
            return FounderToolResponse(
                tool_key=body.tool_key,
                source="cache",
                result=cached,
                venture_id=body.venture_id,
            )

    try:
        result_data, source = await generate_tool_deliverable(body)
        logger.info(
            f"Tool deliverable generated: {body.tool_key}",
            extra={
                "user_id": user_id,
                "tool_key": body.tool_key,
                "source": source,
                "elapsed_seconds": round(time.time() - start_time, 2),
            }
        )
    except ValueError as e:
        logger.error(
            f"Tool generation failed with cleaned error: {str(e)}",
            extra={
                "user_id": user_id,
                "tool_key": body.tool_key,
                "elapsed_seconds": round(time.time() - start_time, 2),
            }
        )
        # Cleaned error from service
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(
            f"Unexpected error in tool generation: {str(e)}",
            extra={
                "user_id": user_id,
                "tool_key": body.tool_key,
                "error_type": type(e).__name__,
                "elapsed_seconds": round(time.time() - start_time, 2),
            },
            exc_info=True
        )
        # Unexpected error
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate deliverable. Please try again.",
        )

    try:
        await save_cached_tool_result(user_id, body.tool_key, chash, result_data, source=source)
        logger.debug(
            f"Tool result cached: {body.tool_key}",
            extra={"user_id": user_id, "tool_key": body.tool_key}
        )
    except Exception as e:
        logger.warning(
            f"Failed to cache tool result: {str(e)}",
            extra={
                "user_id": user_id,
                "tool_key": body.tool_key,
                "error_type": type(e).__name__,
            }
        )
        pass

    # If caller linked this run to an existing venture, update it with analysis data
    updated_venture_id: int | None = body.venture_id
    if body.venture_id:
        try:
            venture = await get_venture(body.venture_id, user_id)
            if venture and (venture.get("source") == "pending" or not venture.get("summary")):
                # Extract flat summary/market/risks etc from the structured result
                analysis_update = _extract_analysis_fields(body.tool_key, result_data, source)
                await update_venture_analysis(body.venture_id, user_id, analysis_update)
                logger.info(
                    f"Updated venture {body.venture_id} with {body.tool_key} analysis",
                    extra={"user_id": user_id, "venture_id": body.venture_id},
                )
        except Exception as e:
            logger.warning(
                f"Failed to update venture analysis: {str(e)}",
                extra={"user_id": user_id, "venture_id": body.venture_id},
            )

    return FounderToolResponse(
        tool_key=body.tool_key,
        source=source,
        result=result_data,
        venture_id=updated_venture_id,
    )
