"""services/founder.py - Founder analysis service orchestrating AI and persistence."""
from __future__ import annotations

import asyncio
import logging
from typing import Any

from core.gemini import clean_gemini_error, request_gemini_json
from schemas.founder import FounderAnalysisRequest, FounderAnalysisResponse
from services.founder_prompts import (
    VOICE_AND_STYLE_GUIDELINES,
    get_intake_analysis_prompt,
    get_tool_prompt,
)

logger = logging.getLogger(__name__)


def _parse_model_response(data: dict) -> FounderAnalysisResponse:
    """Parse and validate Gemini JSON response into FounderAnalysisResponse."""
    return FounderAnalysisResponse(
        source="gemini",
        summary=str(data.get("summary", "")),
        market=str(data.get("market", "")),
        risks=[str(item) for item in data.get("risks", [])][:7],
        mvp=[str(item) for item in data.get("mvp", [])][:7],
        roadmap=[str(item) for item in data.get("roadmap", [])][:8],
        next_steps=[str(item) for item in data.get("next_steps", [])][:8],
    )


async def analyze_founder_idea(payload: FounderAnalysisRequest) -> FounderAnalysisResponse:
    """Analyze founder idea using Gemini AI."""
    logger.info("analyze_founder_idea called")
    prompt = get_intake_analysis_prompt(payload)

    try:
        data = await asyncio.to_thread(
            request_gemini_json,
            prompt,
            timeout=25,
            context_tag="intake_analysis",
        )
        return _parse_model_response(data)
    except ValueError as e:
        logger.warning(f"Validation error in founder analysis: {str(e)}")
        raise
    except Exception as exc:
        logger.error(
            f"Unexpected error in founder analysis: {str(exc)}",
            extra={"error_type": type(exc).__name__},
            exc_info=True,
        )
        raise ValueError(clean_gemini_error(str(exc))) from exc


async def generate_tool_deliverable(payload: Any) -> tuple[dict, str]:
    """Generate tool deliverable using Gemini AI."""
    logger.info(f"generate_tool_deliverable called for: {payload.tool_key}")
    prompt = get_tool_prompt(payload.tool_key, payload)

    try:
        data = await asyncio.to_thread(
            request_gemini_json,
            prompt,
            timeout=30,
            context_tag=f"tool_{payload.tool_key}",
        )
        logger.info(f"Tool deliverable generated successfully: {payload.tool_key}")
        return data, "gemini"
    except ValueError as e:
        logger.warning(f"Error for tool {payload.tool_key}: {str(e)}")
        raise
    except Exception as exc:
        logger.error(
            f"Unexpected error in tool generation for {payload.tool_key}: {str(exc)}",
            extra={
                "tool_key": payload.tool_key,
                "error_type": type(exc).__name__,
            },
            exc_info=True,
        )
        raise ValueError(clean_gemini_error(str(exc))) from exc
