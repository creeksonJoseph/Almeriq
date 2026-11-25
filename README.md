# Almeriq

> Implementation references: [Documentation source map](docs/SOURCE_OF_TRUTH.md).

Almeriq is a platform that brings founders, infrastructure providers, job seekers, investors and experts into one place. It includes tools for building ventures, finding infrastructure and talent, exploring investment opportunities, requesting expert advice, and communicating with other users.

This repository contains the application code for both the frontend and backend.

## What is in the app?

The platform currently includes these user areas:

- **Founders:** venture-building tools, infrastructure discovery, workforce and team workflows, fundraising and expert advisory.
- **Infrastructure providers:** provider profiles and marketplace workflows.
- **Job seekers:** job-related profile and workforce workflows.
- **Investors:** investment opportunities, portfolio and deal-related workflows.
- **Experts:** public expert profiles and advisory requests.
- **Shared platform features:** authentication, messaging and notifications.

For the implementation details behind these workflows, see the [Domain guide](docs/DOMAIN_GUIDE.md).

## Technology

| Part | Stack |
|---|---|
| Frontend | React 19, Vite 8, React Router, Tailwind CSS 4 |
| Backend | Python 3.13+, FastAPI |
| Database access | SQLAlchemy 2 (async) |
| Database migrations | Alembic |
| Production database | PostgreSQL |
| Local development database | SQLite |
| Authentication | JWT in an HttpOnly cookie, bcrypt password hashing |
| Hosting configuration | Vercel (frontend), Render (backend) |
| Integrations | Resend, Cloudinary, Google Gemini; optional Upstash Redis and Sentry |

Check `frontend/package.json` and `server/pyproject.toml` for the exact dependency versions.

## How the repository is organised

```text
Almeriq/
├── server/                  # FastAPI application
│   ├── api/routers/         # HTTP endpoints
│   ├── services/            # Business logic and workflows
│   ├── repositories/        # Database queries
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Request and response schemas
│   ├── core/                # Configuration, database, security, integrations
│   ├── migrations/          # Alembic migrations
│   └── tests/               # Backend tests
├── frontend/                # React + Vite application
│   └── src/
│       ├── Pages/           # Screens and route-level views
│       ├── components/      # Shared UI components
│       ├── context/         # App-wide React contexts
│       ├── hooks/           # Domain and workflow hooks
│       └── lib/             # API client and shared utilities
├── docs/                    # Developer and handover documentation
├── .github/workflows/       # GitHub Actions CI
├── docker-compose.yml       # Local container setup
├── render.yaml              # Render backend service configuration
└── vercel.json              # Root Vercel frontend configuration
```

## Run it locally

You need Python 3.13 or newer, [uv](https://docs.astral.sh/uv/), Node.js 22 and npm (matching CI and the frontend container).

### 1. Start the backend

In a terminal:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and set a unique local `JWT_SECRET_KEY`. The template shows the PostgreSQL/Neon connection-string format and leaves optional integrations blank. Use a separate development database, never the production database. For a disposable local SQLite database, set `DATABASE_URL=sqlite+aiosqlite:///./almeriq_dev.db`. Add credentials only for services you need. Do not copy production secrets into your local environment.

Then install dependencies, prepare the database and start the API:

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

The API will normally be available at `http://localhost:8000`. Once it is running, interactive API documentation is at [http://localhost:8000/docs](http://localhost:8000/docs), and the OpenAPI schema is at `/openapi.json`.

### 2. Start the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
```

Set the local API URL in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then install dependencies and start Vite:

```bash
npm ci
npm run dev
```

Use the local URL printed by Vite (normally `http://localhost:5173`).

More detailed setup instructions, environment variables and troubleshooting notes are in [Setup and operations](docs/SETUP_AND_OPERATIONS.md).

## How development and production work

A few terms are useful when working on this repository:

| Environment | What it means | Almeriq's workflow |
|---|---|---|
| Local | The app running on a developer's computer | Use this to build features and debug locally. |
| Integration | The shared branch where completed work is brought together and checked | `dev` is the team's integration branch. GitHub Actions runs CI for pushes to `dev` and pull requests targeting it. |
| Production | The live app used by real users | `main` is the release branch. The root Vercel configuration enables deployments from `main`. |

**Staging and production are not the same thing.** Staging is a separately deployed test environment, ideally with its own backend and database. The `dev` Git branch is an integration branch; its existence does not, by itself, prove that a separate staging website or staging database is deployed. Confirm the actual Render and Vercel dashboard settings before relying on a staging environment.

### Deployment layout in this repository

- **Frontend — Vercel:** the root `vercel.json` builds the React app from `frontend/`, serves `frontend/dist`, and routes client-side paths back to `index.html`. Its Git settings enable `main` and disable automatic deployments for `dev` and `feat-*` branches.
- **Backend — Render:** `render.yaml` defines a Docker-based web service built from `server/Dockerfile`. It configures `/health` as the health-check path and runs Alembic migrations before deployment.
- **Database — PostgreSQL:** production is expected to use PostgreSQL through `DATABASE_URL`. SQLite is intended for local development, not as the production database.

The repository configuration does not show every setting stored in the hosting dashboards. In particular, confirm the Render service's connected branch, the production database, custom domains, and environment variables with the account owner. Do not assume a staging backend exists until it has been verified.

### Typical release path

1. Create a task branch from the latest `dev`.
2. Make the change and open a pull request targeting `dev`.
3. Wait for the GitHub Actions checks and review the change.
4. Merge into `dev` after approval.
5. When the integration branch is ready for release, open a reviewed promotion pull request from `dev` to `main`.
6. Merge to `main` only after explicit release approval. The Vercel production deployment is associated with `main`.

A frontend deployment and a backend deployment are separate services. Check the deployment status of both when a release changes both sides of the application.

## Tests and quality checks

Run backend tests from `server/`:

```bash
uv run pytest -q
```

Run frontend checks from `frontend/`:

```bash
npm test
npm run lint
npm run build
```

GitHub Actions runs the repository's CI checks. These commands describe how to run the checks; they are not a claim that every branch or commit has passed. Check the workflow run for the exact commit you are reviewing.

## Developer documentation

If you are new to the codebase, start with the **[Developer handover](docs/DEVELOPER_HANDOVER.md)**.

| Guide | What it covers |
|---|---|
| [Setup and operations](docs/SETUP_AND_OPERATIONS.md) | Local setup, configuration and operational notes |
| [System architecture](docs/SYSTEM_ARCHITECTURE.md) | Backend and frontend structure |
| [Domain guide](docs/DOMAIN_GUIDE.md) | Roles, features and user workflows |
| [Frontend guide](docs/FRONTEND_GUIDE.md) | Routes, state, hooks and UI structure |
| [API guide](docs/API_GUIDE.md) | Backend routers and API discovery |
| [Database guide](docs/DATABASE_GUIDE.md) | Data model, relationships and migrations |
| [Testing guide](docs/TESTING_GUIDE.md) | CI, tests and release checks |
| [Access transfer](docs/ACCESS_TRANSFER.md) | Hosting, database and integration account handover |
| [Known gaps](docs/KNOWN_GAPS.md) | Unverified items and follow-up work |
| [Documentation source map](docs/SOURCE_OF_TRUTH.md) | Primary implementation/configuration sources for every maintained guide |

## Security

- Never commit `.env` files, API keys, database URLs, JWT secrets or other credentials.
- Use separate credentials and databases for local, staging (if configured) and production environments.
- Production secrets belong in the hosting provider's environment-variable settings, not in this repository.
- If a secret is exposed, rotate it. Deleting it from a later commit does not make the exposed value safe again.

For the production configuration and account-transfer checklist, see [Access transfer](docs/ACCESS_TRANSFER.md).
