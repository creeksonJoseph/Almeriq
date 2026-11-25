# API Guide

## 1. Source of truth

The FastAPI OpenAPI schema is the authoritative endpoint/request/response reference for a running version of the application:

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- JSON: `/openapi.json`

For local development, use `http://localhost:8000/openapi.json`. For production, use the deployed API host only if you have access and the deployment is the version you intend to document.

This guide lists router ownership. It intentionally does not duplicate every Pydantic field because those change with code and OpenAPI is generated from the live application.

## 2. Router inventory

Routers registered by `server/main.py`:

| Router module | Domain |
|---|---|
| `health.py` | Health/status |
| `waitlist.py` | Public waitlist |
| `auth.py` | Registration, login, logout, current user, onboarding, password reset/OAuth where configured |
| `founder.py` | Founder ventures and AI-assisted workflows |
| `admin.py` | Admin waitlist and administrative actions |
| `provider.py` | Provider profile/setup and provider-specific operations |
| `asset.py` | Provider assets/media |
| `coverage.py` | Provider coverage regions |
| `marketplace.py` | Public marketplace listing and checkout operations |
| `search.py` | Search |
| `order.py` | Orders and fulfillment |
| `deal.py` | Deals/signatures |
| `conversation.py` | Conversations |
| `message.py` | Messages |
| `notification.py` | Notifications |
| `job.py` | Job postings, applications and job-seeker profile |
| `investor.py` | Investor profile/portfolio |
| `startup_pitch.py` | Founder startup pitches and investment actions |
| `expert.py` | Expert profiles and advisory requests |
| `team.py` | Team membership/invitations/workforce |

The actual router prefixes and route declarations are in each module. Do not infer a URL from the module filename; inspect the decorator and router prefix.

## 3. Frontend API client mapping

Domain API modules are under `frontend/src/lib/api/`:
- `auth.js`, `admin.js`, `waitlist.js`
- `founder.js`
- `provider.js`, `marketplace.js`, `orders.js`, `deals.js)
- `job.js`, `investor.js`, `expert.js`
- `conversations.js`, `notifications.js`, `team.js)

Use `frontend/src/lib/client.js` as the shared transport. It configures Axios base URL, cookie credentials, timeout, error extraction and SWR helpers.

## 4. Authentication and authorization

- Most private endpoints expect the auth cookie.
- The shared frontend client enables credentialed requests.
- Some public listing/search endpoints do not require authentication.
- Role-specific endpoints use backend dependencies and/or service-level authorization.
- Ownership checks must happen in the backend. A frontend `RoleRoute` only protects navigation.

Inspect `server/api/dependencies.py` and the endpoint's router/service to determine the exact required role. Do not rely on this high-level guide for a security-sensitive change.

## 5. How to inspect the API

With the backend running:

```bash
curl -s http://localhost:8000/openapi.json > /tmp/almeriq-openapi.json
```

Use Swagger UI to try requests with an authenticated browser session. For command-line tests, use a disposable local account and avoid placing real production tokens in shell history.

## 6. Contract change checklist

When adding/changing an endpoint:
1. Define/update Pydantic schemas.
2. Implement router -> service -> repository flow.
3. Add authentication, role and ownership enforcement.
4. Add tests for success, invalid input, unauthenticated, wrong-role and cross-user access.
5. Update the matching frontend API module and consuming hook/page.
6. Confirm response shape and error handling in frontend.
7. Update OpenAPI-based documentation or this guide if the domain mapping changed.
8. Add a migration only if persistent schema changed.
