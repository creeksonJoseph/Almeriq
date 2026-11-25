from fastapi import Request, Response

from api.cache import with_etag


def make_request(if_none_match: str | None = None) -> Request:
    headers = []
    if if_none_match:
        headers.append((b"if-none-match", if_none_match.encode("latin-1")))
    return Request({
        "type": "http",
        "http_version": "1.1",
        "method": "GET",
        "scheme": "http",
        "path": "/cached-resource",
        "raw_path": b"/cached-resource",
        "query_string": b"",
        "headers": headers,
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
    })


def test_with_etag_returns_payload_and_sets_header():
    response = Response()
    payload = {"items": [{"id": 1}]}

    result = with_etag(make_request(), response, payload)

    assert result == payload
    assert response.headers["ETag"].startswith('W/"')


def test_with_etag_returns_not_modified_for_matching_tag():
    payload = {"items": [{"id": 1}]}
    first_response = Response()
    with_etag(make_request(), first_response, payload)
    etag = first_response.headers["ETag"]

    result = with_etag(make_request(etag), Response(), payload)

    assert isinstance(result, Response)
    assert result.status_code == 304
    assert result.headers["ETag"] == etag
