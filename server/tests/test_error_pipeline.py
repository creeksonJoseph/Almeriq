from fastapi import HTTPException

from api.errors import _is_4xx_event, sentry_before_send


def test_sentry_filter_keeps_http_5xx_events():
    event = {
        "exception": {
            "values": [{"type": "HTTPException", "value": "Internal server error"}],
        },
        "contexts": {"response": {"status_code": 500}},
    }

    assert _is_4xx_event(event) is False
    assert sentry_before_send(event, {}) is event


def test_sentry_filter_drops_http_4xx_events():
    event = {
        "exception": {
            "values": [{"type": "StarletteHTTPException", "value": "Not found"}],
        },
        "contexts": {"response": {"status_code": 404}},
    }

    assert _is_4xx_event(event) is True
    assert sentry_before_send(event, {}) is None


def test_sentry_filter_drops_validation_events():
    event = {"exception": {"values": [{"type": "RequestValidationError"}]}}

    assert _is_4xx_event(event) is True
    assert sentry_before_send(event, {}) is None


def test_sentry_filter_uses_exception_instance_status_when_available():
    error = HTTPException(status_code=503, detail="Service unavailable")
    event = {"exception": {"values": [{"type": "HTTPException"}]}}
    hint = {"exc_info": (HTTPException, error, None)}

    assert sentry_before_send(event, hint) is event
