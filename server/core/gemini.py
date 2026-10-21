"""core/gemini.py - Centralized Google Gemini API client singleton with fallback handling."""
from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from typing import Any

from core.config import GEMINI_API_KEY, GEMINI_MODEL

logger = logging.getLogger(__name__)


def clean_gemini_error(error_message: str) -> str:
    """Convert technical Gemini errors to clean user-friendly messages."""
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


def get_candidate_models() -> list[str]:
    """Return ordered list of models to try, prioritizing configured model and falling back to fast alternatives."""
    models = [GEMINI_MODEL] if GEMINI_MODEL else []
    for fallback in ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-flash-latest"]:
        if fallback not in models:
            models.append(fallback)
    return models


def parse_json_response(text: str) -> Any:
    """Clean markdown code blocks and parse raw JSON text."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1].rsplit("```", 1)[0].strip()
    return json.loads(cleaned)


def request_gemini_json(prompt: str, timeout: int = 25, context_tag: str = "gemini_call") -> Any:
    """Execute JSON generateContent request to Gemini API with model fallback retry loop."""
    if not GEMINI_API_KEY:
        logger.error(f"GEMINI_API_KEY not configured for {context_tag}")
        raise ValueError("AI service not configured. Please contact support.")

    start_time = time.time()
    body = json.dumps(
        {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }
    ).encode("utf-8")

    models = get_candidate_models()
    last_exception = None

    for idx, model_name in enumerate(models):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
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
            with urllib.request.urlopen(request, timeout=timeout) as response:
                result = json.loads(response.read().decode("utf-8"))

            elapsed = time.time() - start_time
            logger.info(
                f"Gemini {context_tag} completed successfully using {model_name}",
                extra={"elapsed_seconds": round(elapsed, 2), "model": model_name, "tag": context_tag},
            )

            text = result["candidates"][0]["content"]["parts"][0]["text"]
            return parse_json_response(text)

        except urllib.error.HTTPError as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini HTTP error with {model_name}: {e.code} {e.reason}",
                extra={
                    "model": model_name,
                    "status_code": e.code,
                    "reason": e.reason,
                    "elapsed_seconds": round(elapsed, 2),
                    "tag": context_tag,
                },
            )
            last_exception = e
            # Retry on 503, 429, 500, 502, 504 if another model is available
            if e.code in (503, 429, 500, 502, 504) and idx < len(models) - 1:
                logger.info(f"Retrying with fallback model: {models[idx + 1]}")
                continue
            error_msg = f"HTTP {e.code}: {e.reason}"
            raise ValueError(clean_gemini_error(error_msg)) from e

        except (urllib.error.URLError, TimeoutError, Exception) as e:
            elapsed = time.time() - start_time
            logger.warning(
                f"Gemini request failed with {model_name}: {str(e)}",
                extra={"model": model_name, "elapsed_seconds": round(elapsed, 2), "tag": context_tag},
            )
            last_exception = e
            if idx < len(models) - 1:
                logger.info(f"Retrying with fallback model: {models[idx + 1]}")
                continue
            raise ValueError(clean_gemini_error(str(e))) from e

    raise ValueError(clean_gemini_error(str(last_exception) if last_exception else "Service unavailable"))
