"""api/routers/founder.py - Authenticated founder workspace endpoints."""
from __future__ import annotations

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

router = APIRouter(tags=["founder"])

# ── helpers ───────────────────────────────────────────────────────────────────

def _require_founder(current_user: dict) -> int:
    if current_user.get("role") != "founder":
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
    result = await analyze_founder_idea(body)

    # Persist automatically — fire and forget errors don't break the response
    try:
        saved = await save_venture(
            user_id=user_id,
            brief=body.model_dump(),
            analysis=result.model_dump(),
        )
        result.venture_id = saved["id"]
    except Exception:
        pass  # Analysis still returned even if DB write fails

    return result


# ── Venture history ───────────────────────────────────────────────────────────

@router.get("/founder/ventures", response_model=list[VentureOut])
@router.get("/api/founder/ventures", response_model=list[VentureOut])
async def ventures_list(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    user_id = _require_founder(current_user)
    return await list_ventures(user_id)


@router.get("/founder/ventures/{venture_id}", response_model=VentureOut)
@router.get("/api/founder/ventures/{venture_id}", response_model=VentureOut)
async def venture_get(
    venture_id: int,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    venture = await get_venture(venture_id, user_id)
    if not venture:
        raise HTTPException(status_code=404, detail="Venture not found.")
    return venture


@router.delete("/founder/ventures/{venture_id}", status_code=204)
@router.delete("/api/founder/ventures/{venture_id}", status_code=204)
async def venture_delete(
    venture_id: int,
    current_user: dict = Depends(get_current_user),
) -> None:
    user_id = _require_founder(current_user)
    deleted = await delete_venture(venture_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Venture not found.")


# ── Idea Validation ───────────────────────────────────────────────────────────

@router.get("/founder/validation", response_model=FounderValidationOut)
@router.get("/api/founder/validation", response_model=FounderValidationOut)
async def validation_get(
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
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
    dims = {k: v for k, v in body.model_dump().items() if v is not None}
    return await upsert_validation(user_id, dims)


# ── Legal Filings ─────────────────────────────────────────────────────────────

@router.get("/founder/legal", response_model=list[FounderLegalOut])
@router.get("/api/founder/legal", response_model=list[FounderLegalOut])
async def legal_list(
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    user_id = _require_founder(current_user)
    return await list_filings(user_id)


@router.post("/founder/legal", response_model=FounderLegalOut)
@router.post("/api/founder/legal", response_model=FounderLegalOut)
async def legal_create(
    body: FounderLegalCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    user_id = _require_founder(current_user)
    return await create_filing(user_id, body.model_dump())


# ── AI Tools Deliverables (with caching) ───────────────────────────────────────

@router.post("/founder/ai-tools", response_model=FounderToolResponse)
@router.post("/api/founder/ai-tools", response_model=FounderToolResponse)
async def execute_tool(
    body: FounderToolRequest,
    current_user: dict = Depends(get_current_user),
) -> FounderToolResponse:
    user_id = _require_founder(current_user)
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
            return FounderToolResponse(
                tool_key=body.tool_key,
                source="cache",
                result=cached,
            )

    result_data, source = await generate_tool_deliverable(body)
    try:
        await save_cached_tool_result(user_id, body.tool_key, chash, result_data, source=source)
    except Exception:
        pass

    return FounderToolResponse(
        tool_key=body.tool_key,
        source=source,
        result=result_data,
    )

