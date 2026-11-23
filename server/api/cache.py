"""Small helpers for conditional JSON GET responses."""
from __future__ import annotations

import hashlib
import json
from typing import Any

from fastapi import Request, Response


def with_etag(request: Request, response: Response, payload: Any) -> Any:
    """Attach a stable weak ETag and return 304 when the client has this version."""
    encoded = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    ).encode("utf-8")
    etag = f'W/"{hashlib.sha256(encoded).hexdigest()}"'
    response.headers["ETag"] = etag

    supplied = request.headers.get("if-none-match", "")
    candidates = {item.strip() for item in supplied.split(",") if item.strip()}
    if "*" in candidates or etag in candidates:
        return Response(
            status_code=304,
            headers={
                "ETag": etag,
                "Cache-Control": response.headers.get("Cache-Control", "private, max-age=30"),
            },
        )
    return payload
