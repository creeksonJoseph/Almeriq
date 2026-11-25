# API Guide

> Implementation references: [Documentation source map](SOURCE_OF_TRUTH.md). Exact live contracts come from the running OpenAPI schema.

## 1. Source of truth

The FastAPI OpenAPI schema is the authoritative endpoint/request/response reference for a running version of the application:
- Swagger UI: /docs
- ReDoc: /redoc
- JSON: /openapi.json

For local development, use http://localhost:8000/openapi.json. The inventory below is derived from router decorators. Use OpenAPI for exact request fields, response schemas, status codes and validation.

## 2. Router prefix warning

Routers are registered in server/main.py. Most domain routers declare an /api prefix. Auth and founder routers register both unprefixed and /api-prefixed aliases. Waitlist and admin use their own prefixes without /api. Do not assume every endpoint begins with /api.

## 3. Endpoint inventory

### Health and waitlist
| Method | Path |
|---|---|
| GET, HEAD | /health, /api/health |
| POST | /sentry-test-error (diagnostic endpoint; currently registered without an environment guard) |
| POST, PUT | /waitlist |
| POST | /waitlist/otp/request |
| POST | /waitlist/otp/verify |

### Authentication
Auth routes have both /auth/... and /api/auth/... aliases unless otherwise noted.

| Method | Path |
|---|---|
| POST | /api/auth/register |
| POST | /api/auth/signup/send-otp |
| POST | /api/auth/signup/verify-otp |
| POST | /api/auth/signup/complete |
| POST | /api/auth/login |
| POST | /api/auth/google |
| POST | /api/auth/onboarding |
| POST | /api/auth/logout |
| GET | /api/auth/me |
| POST | /api/auth/forgot-password |
| POST | /api/auth/reset-password |
| POST | /api/auth/send-change-otp |
| POST | /api/auth/change-password |
| PATCH | /api/users/me/password |

The unprefixed auth aliases also exist. Password change additionally has /users/me/password. Confirm schemas and dependencies for exact cookie/token behavior.

### Founder
Founder routes also have /founder/... and /api/founder/... aliases.

| Method | Path |
|---|---|
| POST | /api/founder/save-brief |
| POST | /api/founder/analyze |
| GET | /api/founder/ventures |
| GET, DELETE | /api/founder/ventures/{venture_id} |
| GET, PUT, POST | /api/founder/validation |
| GET, POST | /api/founder/legal |
| GET | /api/founder/legal/company-guide |
| POST | /api/founder/ai-tools |

### Infrastructure provider and assets
| Method | Path |
|---|---|
| GET, PUT | /api/provider/profile |
| GET, POST | /api/provider/assets |
| GET, PUT, DELETE | /api/provider/assets/{asset_id} |
| POST, DELETE | /api/provider/assets/{asset_id}/media |
| GET, POST, PUT | /api/provider/coverage-regions |

### Marketplace, orders and deals
| Method | Path |
|---|---|
| GET | /api/marketplace/listings |
| GET | /api/marketplace/listings/{asset_id} |
| POST | /api/marketplace/checkout |
| GET | /api/search |
| GET | /api/client/orders |
| GET | /api/client/orders/{order_id} |
| GET | /api/provider/orders |
| GET | /api/provider/orders/summary |
| GET | /api/provider/orders/{order_id} |
| PATCH | /api/provider/orders/{order_id}/status |
| POST | /api/provider/orders/{order_id}/dispatch |
| GET, POST | /api/provider/orders/{order_id}/waybill |
| POST | /api/deals |
| GET | /api/deals/{deal_id} |
| POST | /api/deals/{deal_id}/sign |

### Jobs and talent/team
| Method | Path |
|---|---|
| GET, POST | /api/jobs |
| GET | /api/jobs/mine |
| GET, PUT, DELETE | /api/jobs/{job_id} |
| POST | /api/jobs/{job_id}/apply |
| GET | /api/job-seeker/applications |
| GET, PUT | /api/job-seeker/applications/{application_id} |
| GET | /api/jobs/{job_id}/applications |
| PATCH | /api/jobs/{job_id}/applications/{application_id} |
| GET, PUT | /api/job-seeker/profile |
| GET | /api/founder/talent |
| GET | /api/founder/talent/{user_id} |
| POST | /api/founder/team/invitations |
| GET | /api/founder/team/invitations |
| GET | /api/founder/team/members |
| DELETE | /api/founder/team/members/{member_id} |
| GET | /api/job-seeker/team-invitations |
| PATCH | /api/job-seeker/team-invitations/{invitation_id} |

### Investor, pitches and updates
| Method | Path |
|---|---|
| GET, PUT | /api/investor/profile |
| POST, GET | /api/founder/pitches |
| GET, PUT, DELETE | /api/founder/pitches/{pitch_id} |
| POST | /api/founder/pitches/{pitch_id}/publish |
| POST | /api/founder/pitches/{pitch_id}/unpublish |
| GET | /api/startup-pitches |
| GET | /api/investor/startups |
| GET | /api/investor/pitches |
| GET | /api/investor/startups/{pitch_id} |
| POST | /api/investor/investments |
| GET | /api/investor/portfolio |
| GET, PATCH | /api/investor/portfolio/{investment_id} |
| POST, GET | /api/founder/pitches/{pitch_id}/updates |
| PUT | /api/founder/updates/{update_id} |
| POST | /api/founder/updates/{update_id}/publish |
| GET | /api/investor/updates |
| GET | /api/founder/investment-requests |
| PATCH | /api/founder/investment-requests/{investment_id} |

### Expert and advisory
| Method | Path |
|---|---|
| GET | /api/experts |
| GET, PUT | /api/expert/profile |
| POST | /api/experts/{expert_id}/requests |
| GET | /api/expert/requests |
| PATCH | /api/expert/requests/{request_id} |
| GET | /api/founder/expert-requests |

### Conversations, messages and notifications
| Method | Path |
|---|---|
| POST | /api/conversations/with-provider/{provider_id} |
| GET | /api/conversations |
| GET | /api/conversations/summary |
| GET | /api/conversations/{conversation_id} |
| POST | /api/conversations/{conversation_id}/read |
| POST | /api/advisory-requests/{request_id}/conversation |
| POST | /api/investment-requests/{investment_id}/conversation |
| GET, POST | /api/conversations/{conversation_id}/messages |
| GET | /api/notifications |
| PATCH | /api/notifications/{notification_id}/read |
| PATCH | /api/notifications/read-all |

### Admin
The admin router uses /admin, not /api.

| Method | Path |
|---|---|
| GET | /admin/waitlist |
| GET | /admin/providers |
| GET | /admin/providers/{provider_id}/verification-history |
| PATCH | /admin/providers/{provider_id}/verification |
| PATCH | /admin/me/role |

Treat admin endpoints as sensitive. Confirm backend admin authorization and audit behavior before exposing or changing them.

## 4. Frontend API client mapping

Domain API modules are under frontend/src/lib/api/:
- auth.js, admin.js, waitlist.js
- founder.js
- provider.js, marketplace.js, orders.js, deals.js
- job.js, investor.js, expert.js
- conversations.js, notifications.js, team.js

Use frontend/src/lib/client.js as the shared transport. It configures Axios base URL, cookie credentials, timeout, error extraction and SWR helpers.

## 5. Authentication and authorization

- Most private endpoints expect the auth cookie.
- The shared frontend client enables credentialed requests.
- Some public listing/search endpoints do not require authentication.
- Role-specific endpoints use backend dependencies and/or service-level authorization.
- Ownership checks must happen in the backend. A frontend RoleRoute only protects navigation.

Inspect server/api/dependencies.py and the endpoint's router/service to determine the exact required role. Do not rely on this high-level guide for a security-sensitive change.

## 6. How to inspect the API

With the backend running:

~~~bash
curl -s http://localhost:8000/openapi.json > /tmp/almeriq-openapi.json
~~~

Use Swagger UI to try requests with an authenticated browser session. For command-line tests, use a disposable local account and avoid placing real production tokens in shell history. The Sentry diagnostic endpoint is registered unconditionally in `server/api/routers/health.py`; do not assume it is disabled in production. Gate or remove it before exposing a production deployment.

## 7. Contract change checklist

When adding/changing an endpoint:
1. Define/update Pydantic schemas.
2. Implement router -> service -> repository flow.
3. Add authentication, role and ownership enforcement.
4. Add tests for success, invalid input, unauthenticated, wrong-role and cross-user access.
5. Update the matching frontend API module and consuming hook/page.
6. Confirm response shape and error handling in frontend.
7. Update OpenAPI-based documentation or this guide if the domain mapping changed.
8. Add a migration only if persistent schema changed.
