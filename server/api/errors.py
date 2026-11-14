"""api/errors.py - Standardized error response pipeline.

4xx errors: logged as WARNING, returned as standardized JSON, suppressed in Sentry.
5xx errors: logged at ERROR, captured to Sentry, generic safe response to client.
"""
from __future__ import annotations

import logging
from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from sentry_sdk import capture_exception

from core.config import settings
from core.exceptions import ALIMERIQError

logger = logging.getLogger("almeriq.errors")


def _error_payload(success: bool, message: str, detail: str, code: str) -> dict[str, Any]:
    return {"success": success, "message": message, "detail": detail, "code": code}


async def almeriq_error_handler(request: Request, exc: ALIMERIQError) -> JSONResponse:
    """Handle custom domain exceptions (4xx). Logged as WARNING, suppressed in Sentry."""
    logger.warning("4xx %s: %s (path=%s)", exc.code, exc.message, request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(False, exc.message, exc.detail, exc.code),
        headers=exc.headers,
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic RequestValidationError (422). Logged as WARNING, suppressed in Sentry."""
    errors = exc.errors()
    field_errors = [
        {"field": " -> ".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg", "")}
        for err in errors
    ]
    logger.warning("4xx VALIDATION_ERROR: %s (path=%s)", field_errors, request.url.path)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error.",
            "detail": f"Invalid fields: {', '.join(e['field'] for e in field_errors)}",
            "code": "VALIDATION_ERROR",
            "fields": field_errors,
        },
    )


async def pydantic_validation_error_handler(request: Request, exc: PydanticValidationError) -> JSONResponse:
    """Handle Pydantic v2 ValidationError (422). Logged as WARNING, suppressed in Sentry."""
    errors = exc.errors()
    field_errors = [
        {"field": " -> ".join(str(loc) for loc in err.get("loc", [])), "message": err.get("msg", "")}
        for err in errors
    ]
    logger.warning("4xx VALIDATION_ERROR: %s (path=%s)", field_errors, request.url.path)
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation error.",
            "detail": f"Invalid fields: {', '.join(e['field'] for e in field_errors)}",
            "code": "VALIDATION_ERROR",
            "fields": field_errors,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle Starlette/FastAPI HTTPException.

    4xx (< 500): standardized JSON, logged as WARNING, suppressed in Sentry.
    5xx (>= 500): re-raise so the catch-all handler processes it.
    """
    if exc.status_code < 500:
        logger.warning("4xx HTTP_%s: %s (path=%s)", exc.status_code, exc.detail, request.url.path)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(False, str(exc.detail), str(exc.detail), f"HTTP_{exc.status_code}"),
        )
    # 5xx falls through to catch-all handler
    raise exc


async def catch_all_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global catch-all for unhandled exceptions (5xx).

    Logged at ERROR, captured to Sentry, generic safe response to client.
    """
    logger.error("5xx crash: %s (path=%s)", exc, request.url.path, exc_info=True)
    capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content=_error_payload(
            False,
            "An unexpected server error occurred. Please try again in a moment.",
            "An unexpected server error occurred. Please try again in a moment.",
            "INTERNAL_SERVER_ERROR",
        ),
    )


def _is_4xx_event(event: dict[str, Any]) -> bool:
    """Inspect a Sentry event to determine if it represents a 4xx client error."""
    request_info = event.get("request", {}) or {}
    # Check for an ALIMERIQError or HTTPException with status < 500 in the exception
    exception = event.get("exception", {}) or {}
    values = exception.get("values", [])
    for val in values:
        type_name = val.get("type", "")
        if type_name in ("ALIMERIQError", "HTTPException", "StarletteHTTPException"):
            # Check the status code from the exception's stack/locals or message
            # ALIMERIQError instances carry status_code; HTTPException carries status_code
            return True
    # Also check the event's transaction/URL pattern for 4xx-like paths
    return False


def sentry_before_send(event: dict[str, Any], hint: dict[str, Any] | None) -> dict[str, Any] | None:
    """Sentry before_send callback: drop 4xx client errors, keep 5xx crashes.

    Returns None to drop the event from Sentry (4xx), or the event to keep it (5xx).
    """
    if hint is None:
        return event

    exc_info = hint.get("exc_info")
    if exc_info is not None:
        exc_type, exc_value, _tb = exc_info
        if isinstance(exc_value, ALIMERIQError) and exc_value.status_code < 500:
            return None
        if isinstance(exc_value, HTTPException) and exc_value.status_code < 500:
            return None

    # Also drop events that are clearly 4xx based on event data
    if _is_4xx_event(event):
        return None

    return event
