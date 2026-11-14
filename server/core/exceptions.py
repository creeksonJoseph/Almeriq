"""core/exceptions.py - Custom domain exceptions for ALIMERIQ.

Strict separation between client-side user errors (4xx) and server-side crashes (5xx).
All 4xx exceptions are logged as warnings and suppressed in Sentry via before_send.
"""


class ALIMERIQError(Exception):
    """Base domain exception with a status code, error code, and user-safe message."""

    status_code: int = 500
    code: str = "SERVER_ERROR"
    message: str = "An unexpected server error occurred."

    def __init__(self, message: str | None = None, detail: str | None = None, headers: dict | None = None):
        self.message = message or self.message
        self.detail = detail or self.message
        self.code = self.code
        self.status_code = self.status_code
        self.headers = headers or {}
        super().__init__(self.message)


class BadRequestError(ALIMERIQError):
    status_code = 400
    code = "BAD_REQUEST"
    message = "Bad request."


class AuthenticationError(ALIMERIQError):
    status_code = 401
    code = "AUTHENTICATION_ERROR"
    message = "Authentication required."


class ForbiddenError(ALIMERIQError):
    status_code = 403
    code = "FORBIDDEN"
    message = "Forbidden."


class NotFoundError(ALIMERIQError):
    status_code = 404
    code = "NOT_FOUND"
    message = "Resource not found."


class ConflictError(ALIMERIQError):
    status_code = 409
    code = "CONFLICT"
    message = "Conflict."


class DomainValidationError(ALIMERIQError):
    status_code = 422
    code = "VALIDATION_ERROR"
    message = "Validation error."
