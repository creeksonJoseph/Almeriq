# ALMERIQ Developer Handover

> Last reviewed: 2026-11-25  
> Repository: [creeksonJoseph/Almeriq](https://github.com/creeksonJoseph/Almeriq)  
> Working branch for this documentation pass: `docs/developer-handover`

This is the entry point for the next developer. It describes the repository as it exists in source, not as originally planned. When documentation conflicts with implementation, verify the code and update the documentation rather than assuming the older document is correct.

## 1. Product at a glance

Almeriq is a multi-role platform for founders, infrastructure providers, job seekers, investors, and experts. It combines founder venture-building tools with marketplace, workforce, fundraising, advisory, messaging, and notification workflows.

The repository is a monorepo:
- `server/`: FastAPI backend, async SQLAlchemy persistence, Alembic migrations, domain services.
- `frontend/`: React + Vite single-page application.
- `docs/`: engineering contracts, plans, audits, and handover material.
- Root deployment files: Docker Compose, Render blueprint, and Vercel configuration.

## 2. Start here

Recommended reading order:
1. [Setup and operations](SETUP_AND_OPERATIONS.md) - prerequisites, environment, local run, migrations, tests, deployment notes.
2. [System architecture](SYSTEM_ARCHITECTURE.md) - runtime structure, backend layers, frontend routing/state, authentication.
3. [Domain and workflow guide](DOMAIN_GUIDE.md) - roles, major user journeys, domain boundaries.
4. [API guide](API_GUIDE.md) - router inventory, auth expectations, OpenAPI discovery.
5. [Known gaps and handover checklist](KNOWN_GAPS.md) - items that need confirmation or follow-up.
6. Existing engineering references under [engineering](engineering/).

## 3. Current branch baseline

At the start of this documentation pass:
- `main`: `146263a9ec2002389dc5c3fba4a37d09cc3ff1a3` (merge commit for PR #39).
- `dev`: `3bffa05097bad050e7f70e5e05f398369ecc9144`.
- Both branches contained the same root application tree and the same initial documentation files.
- Documentation work is isolated on `docs/developer-handover`, created from `dev`.

Do not assume the local checkout is current. Fetch and inspect branch heads before beginning work.

## 4. Technology summary

| Area | Implementation |
|---|---|
| Backend language | Python 3.13+ |
| API | FastAPI |
| ORM | SQLAlchemy 2 async |
| Database migrations | Alembic |
| Development database | SQLite via aiosqlite |
| Production database | PostgreSQL; Neon is referenced in deployment examples |
| Frontend | React 19, Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 |
| Forms/validation | React Hook Form, Zod |
| HTTP | Axios with credentials |
| Auth | JWT, HttpOnly cookie, bcrypt password hashing |
| Email | Resend |
| AI | Google Gemini (founder tools) |
| Media | Cloudinary (asset/listing media) |
| Cache | In-process frontend SWR cache; optional Upstash Redis backend integration |
| Error monitoring | Sentry |
| Hosting config | Render backend blueprint; Vercel frontend config |

See the dependency manifests for exact version ranges: `server/pyproject.toml` and `frontend/package.json`.

## 5. Backend architecture

The intended request path is:

`HTTP router -> service -> repository -> SQLAlchemy model -> database`

- `server/main.py` creates the FastAPI application, configures middleware/error handlers, initializes Sentry when configured, and registers domain routers.
- `server/api/routers/` contains HTTP endpoints and request/response wiring.
- `server/api/dependencies.py` contains request dependencies, including current-user/role access.
- `server/services/` owns business workflows and orchestration.
- `server/repositories/` owns database queries and persistence.
- `server/models/` defines SQLAlchemy entities.
- `server/schemas/` defines Pydantic request/response schemas.
- `server/core/` contains configuration, database, security, roles, cache and integrations.
- `server/migrations/versions/` is the schema history.

Keep business rules out of route handlers. Enforce ownership and authorization on the backend even when the frontend has role-aware routes.

## 6. Frontend architecture

- `frontend/src/App.jsx` is the route registry. Most screens are loaded through lazy imports.
- `frontend/src/Pages/` contains route-level screens grouped by domain.
- `frontend/src/components/` contains shared layout, navigation, onboarding and UI primitives.
- `frontend/src/context/` contains cross-app providers such as auth, idea, toast, sidebar and confirmation contexts.
- `frontend/src/hooks/` contains domain/workflow state and data-fetching hooks.
- `frontend/src/lib/client.js` is the shared Axios client and in-memory SWR/ETag cache.
- `frontend/src/lib/api/` contains domain-specific API modules.
- `frontend/src/lib/roles.js` normalizes frontend role identifiers.

Avoid introducing a second HTTP client in a page or hook. Add API functions to the matching domain module and use the shared client.

## 7. Authentication and roles

The backend hashes passwords with bcrypt and issues JWTs. The frontend Axios client sets `withCredentials: true`, allowing the browser to send the HttpOnly auth cookie. The auth context loads the current user from the backend and maintains frontend session state.

Role identifiers are normalized before comparisons. The current product includes founder, infrastructure provider, job seeker, investor, and expert experiences, plus administrative waitlist access. Check `server/core/roles.py`, `frontend/src/lib/roles.js`, `server/api/dependencies.py`, and `frontend/src/components/RoleRoute.jsx` before changing role behavior.

Onboarding is role-aware, but not every role has an identical profile setup flow. In particular, expert role selection currently uses the shared onboarding flow; expert profile editing is a separate screen at `/expert/profile`.

## 8. Database and migrations

- Models are registered through `server/models/__init__.py`; check this when adding a model so Alembic metadata sees it.
- Alembic configuration is in `server/alembic.ini` and `server/migrations/env.py`.
- The Render blueprint has a pre-deploy migration command.
- The FastAPI lifespan also performs an Alembic upgrade/check before serving traffic. This behavior is important operationally: the application refuses to start if migration state cannot be reconciled with the expected head.
- Never edit a migration that may already have run in a shared environment. Add a new migration instead.
- Check for multiple Alembic heads before release. Do not independently create parallel migration heads.

The full operational commands and cautions are in [Setup and operations](SETUP_AND_OPERATIONS.md).

## 9. CI and branch workflow

The repository uses GitHub Actions at `.github/workflows/ci.yml`. The current team workflow is:
- `dev` is the integration/testing branch.
- Feature and documentation work should branch from `dev`.
- Push and validate changes through CI on `dev`/the applicable PR workflow.
- Promote `dev` to `main` only after review and explicit release approval.

Do not force-push, rewrite shared history, or delete branches/worktrees without explicit instruction. Do not report tests as passing unless the workflow output confirms it.

## 10. How to make a safe change

1. Fetch the latest refs and inspect the target branch.
2. Identify the owning domain and read its router, service, repository, model, schema, frontend API module, hook, and page.
3. Check the related tests and migrations.
4. Write a small implementation plan before changing shared contracts.
5. Implement the backend and frontend together when a contract changes.
6. Add regression tests, especially for authorization, ownership, state transitions and error cases.
7. Run backend tests, frontend tests, lint and production build, or use CI where local execution is unavailable.
8. Review the complete diff and generated migration.
9. Open a PR into `dev`; merge only after checks and review.
10. Update docs when behavior, API contracts, configuration or operational procedures change.

## 11. Documentation accuracy note

Some original documents were written while the project was still a provider-only implementation plan. They contain obsolete statements such as missing provider/job/investor domains and an expert placeholder. Treat the new handover set as the current overview. Historical planning material should be clearly labelled as historical rather than silently treated as current implementation.
