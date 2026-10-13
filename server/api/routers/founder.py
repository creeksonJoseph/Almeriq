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
)
from schemas.founder import (
    FounderAnalysisRequest,
    FounderAnalysisResponse,
    FounderLegalCreate,
    FounderLegalOut,
    FounderToolRequest,
    FounderToolResponse,
    FounderValidationOut,
    FounderValidationUpdate,
    VentureOut,
)
from services.founder import analyze_founder_idea, generate_tool_deliverable

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


# ── AI Tools Deliverables (with caching) ───────────────────────────────────────

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
            return FounderToolResponse(
                tool_key=body.tool_key,
                source="cache",
                result=cached,
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

    return FounderToolResponse(
        tool_key=body.tool_key,
        source=source,
        result=result_data,
    )
