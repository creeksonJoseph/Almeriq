# System Architecture

> Source review date: 2026-11-25. This describes the repository structure and code paths; it is not a deployment penetration test or runtime verification.

## 1. Runtime topology

```text
Browser
  |
  | React SPA (Vite build)
  | Axios, withCredentials=true
  v
FastAPI application (server/main.py)
  |-- CORS + GZip middleware
  |-- normalized exception handlers
  |-- Sentry (when SENTRY_DSN is configured)
  |-- API routers
  |
  +--> Services --> Repositories --> SQLAlchemy async session --> SQLite / PostgreSQL
  |
  +--> External integrations: Gemini, Resend, Cloudinary, optional Upstash Redis
```

The frontend and backend are independently built/deployed. The browser talks to the API using `VITE_API_BASE_URL`. Configure the backend CORS allowlist to include every frontend origin that needs credentialed requests.

## 2. Backend module responsibilities

| Path | Responsibility |
|---|---|
| `server/main.py` | FastAPI app, lifespan, middleware, router registration, exception handlers, optional Sentry initialization |
| `server/api/routers/` | HTTP endpoints and dependency declarations |
| `server/api/dependencies.py` | Current user, role checks and shared request dependencies |
| `server/api/errors.py` | Consistent HTTP/Pydantic/application exception responses and Sentry filtering |
| `server/services/` | Business logic, workflow orchestration and integration calls |
| `server/repositories/` | SQLAlchemy reads/writes |
| `server/models/` | SQLAlchemy ORM mappings |
| `server/schemas/` | Pydantic request/response types |
| `server/core/config.py` | Environment-backed settings |
| `server/core/db.py` | Async engine, session factory and request-scoped session dependency |
| `server/core/security.py` | bcrypt password hashing and JWT encode/decode |
| `server/core/roles.py` | Canonical role normalization and comparison |
| `server/core/gemini.py` | Gemini integration support |
| `server/core/redis_client.py` | Optional Upstash Redis client/fallback |
| `server/migrations/` | Alembic configuration and revision history |

### Request/session lifecycle

The `get_db` dependency yields one async SQLAlchemy session per request. It commits after a successful request and rolls back if an exception escapes. Services/repositories should use that request session rather than opening unrelated sessions. The engine is disposed during application shutdown.

### Application startup and migrations

The FastAPI lifespan reads Alembic heads, opens a synchronous SQLAlchemy connection for migration inspection, runs `alembic upgrade head` in an executor, and verifies that the database revision matches an expected head. A failure aborts startup. Render also defines `uv run alembic upgrade head` as a pre-deploy command. Understand both mechanisms before changing release/migration behavior; they are intentionally redundant safeguards but may affect deployment timing.

## 3. Frontend module responsibilities

| Path | Responsibility |
|---|---|
| `frontend/src/main.jsx` | React entry point and provider composition |
| `frontend/src/App.jsx` | Route registry and lazy route imports |
| `frontend/src/Pages/` | Route-level pages, grouped by role/domain |
| `frontend/src/components/` | Shared layout, navigation, onboarding and UI |
| `frontend/src/components/ui/` | Reusable UI primitives |
| `frontend/src/context/` | Auth, ideas, toast, confirmation and sidebar state |
| `frontend/src/hooks/` | Domain workflows and data loading |
| `frontend/src/lib/client.js` | Shared Axios client, error parsing, in-memory cache |
| `frontend/src/lib/api/` | API functions grouped by backend domain |
| `frontend/src/lib/roles.js` | Frontend role normalization |

### HTTP client and cache

The Axios instance uses `VITE_API_BASE_URL`, `withCredentials: true`, JSON content type and a 30-second timeout. The same module provides:
- `apiFetch` for GET requests with optional ETag revalidation.
- `fetchWithSWR` with a 30-second in-memory TTL and in-flight request deduplication.
- `getCached`, `setCached`, `subscribeCache` and `invalidate`.

This cache is in the browser process; it is not a durable shared server cache. Mutations should invalidate or update affected cache keys. Cache keys must be scoped appropriately for user-specific data.

## 4. Authentication model

1. User signs in/registers through the auth API.
2. Backend verifies credentials and creates a JWT using configured signing secret/algorithm/expiry.
3. The token is delivered through an HttpOnly cookie (cookie name and attributes are configurable).
4. Axios sends cookies with API calls because `withCredentials` is enabled.
5. The auth context requests the current-user endpoint and updates client session state.
6. Protected frontend routes check authentication and, where applicable, role.
7. Backend dependencies must independently enforce authentication, role and resource ownership.

A frontend route guard is a navigation/user-experience control, not a security boundary.

## 5. Role and domain map

| Domain | Main backend modules | Main frontend areas |
|---|---|---|
| Auth / waitlist / admin | auth, waitlist, admin routers/services | auth pages, onboarding, admin waitlist |
| Founder | founder, team, job, startup pitch, expert request flows | `Pages/founder`, founder components/hooks |
| Infrastructure provider | provider, asset, coverage, order, deal | `Pages/provider` |
| Marketplace | marketplace, search | `Pages/marketplace`, checkout |
| Job seeker / employer | job, team | `Pages/jobseeker`, shared employer pages |
| Investor | investor, startup pitch/deal | `Pages/investor` |
| Expert | expert | `Pages/expert`, founder expert discovery |
| Shared collaboration | conversation, message, notification | shared messages/alerts |

For actual registered router modules, inspect imports and `app.include_router` calls in `server/main.py`.

## 6. Error handling and observability

- Backend exception handlers are registered in `server/main.py`; implementations live in `server/api/errors.py`.
- Sentry is initialized only when `SENTRY_DSN` is non-empty. The app sets `send_default_pii=False` and uses a project-specific before-send filter.
- Python logging is configured to stdout, making logs available through the hosting provider.
- Frontend Sentry packages are present in the dependency manifest; inspect frontend initialization/config before assuming a particular event is captured.
- Do not log passwords, JWTs, secret values, or sensitive user payloads.

## 7. External integrations and failure boundaries

| Integration | Config keys | Purpose | If not configured |
|---|---|---|---|
| Gemini | `GEMINI_API_KEY`, `GEMINI_MODEL` | Founder AI analysis/tools | AI features may fail or be unavailable |
| Resend | `RESEND_API_KEY`, `DOMAIN` | Waitlist/email delivery | Email side effects cannot be delivered |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Uploaded listing/asset media | Upload-dependent workflows fail |
| Upstash Redis | `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` | Optional backend cache/rate support | Code provides an in-memory fallback; multi-instance behavior differs |
| Sentry | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, sample rates | Error/performance monitoring | No Sentry reporting |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in integration | OAuth cannot complete without valid credentials |

Confirm each integration's current call sites and fallback behavior before changing provider configuration.
