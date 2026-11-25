# Setup and Operations

## 1. Prerequisites

- Python 3.13 or newer.
- `uv` for Python dependency/environment management.
- Node.js 22 and npm (the current GitHub Actions workflow uses Node 22).
- Git.
- Optional: Docker + Docker Compose.
- Credentials only for integrations you intend to exercise (Gemini, Resend, Cloudinary, Google OAuth, Upstash Redis, Sentry).

Use `server/pyproject.toml`, `server/uv.lock`, and `frontend/package-lock.json` as dependency sources of truth. GitHub Actions currently pins Python 3.13 and Node 22.

## 2. Clone and branch

```bash
git clone https://github.com/creeksonJoseph/Almeriq.git
cd Almeriq
git fetch origin --prune
git switch dev
git pull --ff-only origin dev
```

Create a task branch from the latest `dev`. Do not develop directly on `main`. Keep production promotion separate and reviewed.

## 3. Backend setup

```bash
cd server
cp .env.example .env
# Edit .env and set a unique JWT_SECRET_KEY.
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

The backend example uses a PostgreSQL/Neon URL placeholder. Use your own development database, or switch to the documented SQLite URL for a disposable local database. The API is normally available at:
- API root: `http://localhost:8000`
- Health endpoint: `http://localhost:8000/health` (also inspect the health router for readiness semantics)
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

Run commands from `server/` because the app imports modules such as `core`, `api`, and `models` as top-level packages and the Alembic config is located there.

## 4. Frontend setup

In another terminal:

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000 for local backend development.
npm ci
npm run dev
```

Vite normally serves the frontend at `http://localhost:5173`. The frontend Axios client sends credentials. Ensure `ALLOWED_ORIGINS` in the backend includes the exact frontend origin, including port.

## 5. Docker Compose

From repository root:

```bash
docker compose up --build
```

The Compose stack starts the backend and frontend on ports 8000 and 5173. The backend uses a named Docker volume mounted at `/data` for its SQLite database, so the local database survives backend container recreation. Remove the volume explicitly only when you intend to discard that local data:

```bash
docker compose down -v
```

Compose supplies `JWT_SECRET_KEY`, which matches the setting read by `server/core/config.py`. Its value is a local-only placeholder; replace it before sharing the environment and never use it in production. The Compose file does not set an `ENVIRONMENT` setting because the current Settings model does not declare one.


## 6. Environment variables

Backend settings are defined in `server/core/config.py`. Pydantic Settings reads `.env`, `.env.dev`, and `.env.prod` (case-insensitive); actual process environment variables can also supply values. There is one backend template: `server/.env.example`. Copy it to `server/.env` for local development. It shows the PostgreSQL/Neon connection-string format, local cookie settings, and blank optional integration credentials. Use a separate development database, never production. To use a disposable local SQLite database instead, set `DATABASE_URL=sqlite+aiosqlite:///./almeriq_dev.db`. For hosted environments, set the required values directly in the hosting provider's environment settings rather than maintaining separate committed production templates.

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Backend | SQLite in local development; PostgreSQL in production. PostgreSQL URLs are normalized to `postgresql+psycopg`. |
| `JWT_SECRET_KEY` | Auth | Replace the example/default value with a strong secret. Never commit it. |
| `JWT_ALGORITHM` | Auth | Defaults to HS256. |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Auth | Defaults to 10080 minutes (7 days). |
| `COOKIE_NAME` | Auth | Defaults to `auth_token`. |
| `COOKIE_SECURE` | Auth | False for local HTTP; set true for HTTPS production. |
| `COOKIE_SAMESITE` | Auth | Defaults to `lax`; validate cross-site deployment topology before changing. |
| `ALLOWED_ORIGINS` | Browser API access | Comma-separated origins; supports JSON list input in settings parser. Must be exact origins when using credentialed CORS. |
| `RESEND_API_KEY` | Email | Resend API credential. |
| `DOMAIN` | Email | Domain used in email footer links; example uses `alimeriq.app`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth | Configure matching OAuth app and redirect origins. |
| `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` | Optional cache/rate integration | Both should be valid; review fallback behavior in `core/redis_client.py`. |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Founder AI | Server-side only; never expose key to Vite. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Media uploads | Server-side credentials. |
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `SENTRY_PROFILES_SAMPLE_RATE` | Monitoring | Use production-appropriate sampling. |

Frontend:
- `VITE_API_BASE_URL`: API origin/base URL. Vite variables are public in the built bundle; never put secrets in `VITE_*`.
- `VITE_GOOGLE_CLIENT_ID`: public OAuth client ID used by frontend integration.

The single backend example includes one comma-separated `ALLOWED_ORIGINS` value for local development and the Almeriq domains. For production, set the exact production frontend origins in the Render environment; do not blindly reuse localhost origins. Never copy real production credentials into example files or issue comments. If a credential has been exposed, rotate it; deleting it from the latest tree is not sufficient.

## 7. Database and Alembic

Useful commands from `server/`:

```bash
uv run alembic current
uv run alembic heads
uv run alembic history --verbose
uv run alembic upgrade head
uv run alembic downgrade -1
```

Before creating a migration:
1. Read the affected model and all related migrations.
2. Confirm the model is imported by `server/models/__init__.py`.
3. Check `alembic heads` and coordinate if there is more than one head.
4. Generate a revision and inspect every operation; autogenerated migrations are not automatically safe.
5. Test upgrade against a clean database and a copy of a database at the prior revision.
6. Check SQLite and PostgreSQL compatibility where both are supported.
7. Never edit a migration that may have run in a shared environment.

Production caution: both Render's `preDeployCommand` and the FastAPI lifespan currently invoke migration upgrades. Review this dual execution if migration locking, deployment concurrency or startup time becomes a concern. Do not disable either path without an explicit operational decision.

## 8. Test, lint and build

Backend (from `server/`):

```bash
uv run pytest -q
```

Frontend (from `frontend/`):

```bash
npm test
npm run lint
npm run build
```

The frontend test script already invokes `vitest run`; do not append an extra `--run` unless needed. For focused tests, pass a test filename/pattern after the script.

The GitHub Actions workflow is `.github/workflows/ci.yml`. It runs on pushes to `dev`, pull requests targeting `dev`, and manual dispatch. It pins Python 3.13 and Node 22, runs backend pytest, frontend ESLint, Vitest and the frontend production build. A local test command being documented is not evidence it passed. Record the actual CI run URL/commit when reporting verification.

The optional `server/scripts/smoke_test.sh` is a separate curl-based workflow, not part of this CI job. Read the script before running it: it creates test users and domain records in the configured database and does not clean up all persisted records. Run it only against a disposable local database, never production.

## 9. Deployment overview

### Backend

The repository includes `render.yaml` and `server/Dockerfile`. The Render blueprint declares:
- service name `alimeriq-backend`;
- Docker runtime using `server/Dockerfile` with `server/` as build context;
- health check path `/health`;
- pre-deploy migration command `uv run alembic upgrade head`;
- environment variables supplied through Render for database, email and Cloudinary.

The YAML is not a complete inventory of the live Render dashboard. It does not declare `JWT_SECRET_KEY`, `COOKIE_SECURE`, `GEMINI_API_KEY`, Google OAuth, Upstash or Sentry variables; these may be manually configured in the dashboard. Verify that a strong unique `JWT_SECRET_KEY` is explicitly set and `COOKIE_SECURE=true` for HTTPS production. The source default JWT secret is unsafe. Verify database attachment, domains, scaling, health checks and deploy history in the hosting account before making changes.

### Frontend

The repository has root `vercel.json` and `frontend/vercel.json`. The root config builds from the monorepo root and disables automatic deployment for `dev` while enabling `main`; the frontend-level config assumes the project root is `frontend/`. Confirm which config the live Vercel project uses, the actual project root/build/output settings and custom domain. The frontend must point to the intended API base URL and the backend CORS allowlist must include its production origin.

### Release checklist

- [ ] PR reviewed and merged to `dev`.
- [ ] CI green on exact commit.
- [ ] Database migration reviewed; single intended Alembic head.
- [ ] Production environment variables verified without exposing values.
- [ ] Backend deploy/health check successful.
- [ ] Frontend deploy successful and points to correct API.
- [ ] Login, onboarding, one core workflow per role, uploads, messaging and notifications smoke-tested.
- [ ] Sentry/logs checked after deployment.
- [ ] Explicit release approval obtained before `dev` -> `main`.

## 10. Troubleshooting guide

| Symptom | First checks |
|---|---|
| Browser CORS error | Exact frontend origin in `ALLOWED_ORIGINS`; credentials enabled; frontend API URL correct |
| Login appears successful but subsequent API calls are unauthenticated | Cookie domain/path/secure/samesite attributes; HTTPS; browser cookie policy; `withCredentials` |
| Backend refuses to start | Render logs; database connectivity; Alembic current/heads; migration failure |
| PostgreSQL connection fails | URL scheme, credentials, network access, SSL mode; DB URL normalization in `core/db.py` |
| Upload fails | Cloudinary environment variables and request size/content type |
| AI analysis fails | Gemini key/model/quota/network; server logs and Sentry |
| Email not delivered | Resend key, verified sender/domain and provider response |
| Stale frontend data | SWR cache key/invalidation and ETag response behavior |
| Route redirects unexpectedly | Auth context, onboarding state, role normalization and route guard |

## 11. Operational unknowns

This repository review cannot verify live hosting dashboards, production secrets, actual database contents, DNS, external provider account status, billing, backups, or real user workflows. The incoming maintainer should obtain access to those systems from the project owner and validate them before changing production.
