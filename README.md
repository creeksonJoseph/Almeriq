# ALIMERIQ

Almeriq is a multi-role platform for founders, infrastructure providers, job seekers, investors and experts. It brings together venture-building tools, an infrastructure marketplace, workforce workflows, fundraising, expert advisory, messaging and notifications.

This repository contains the full-stack application:
- **Backend:** FastAPI, Python 3.13+, SQLAlchemy 2 async and Alembic.
- **Frontend:** React 19, Vite 8, React Router and Tailwind CSS 4.
- **Database:** SQLite for local development; PostgreSQL for production deployments.
- **Authentication:** JWT delivered using an HttpOnly cookie; bcrypt password hashing.
- **Integrations:** Gemini, Resend, Cloudinary, optional Upstash Redis and Sentry.

## Developer documentation

Start with **[Developer Handover](docs/DEVELOPER_HANDOVER.md)**. It links to:
- [System architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Setup and operations](docs/SETUP_AND_OPERATIONS.md)
- [Database, data model and migrations](docs/DATABASE_GUIDE.md)
- [Production access transfer checklist](docs/ACCESS_TRANSFER.md)
- [Domain and workflow guide](docs/DOMAIN_GUIDE.md)
- [Frontend route and state guide](docs/FRONTEND_GUIDE.md)
- [API guide](docs/API_GUIDE.md)
- [Known gaps and handover checklist](docs/KNOWN_GAPS.md)

The API's generated OpenAPI schema is available at /openapi.json when the backend is running; Swagger UI is at /docs.

## Repository layout

~~~text
Almeriq/
├── server/                 # FastAPI backend
│   ├── api/routers/        # HTTP endpoints
│   ├── services/           # Business workflows
│   ├── repositories/       # Data access
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── core/                # Settings, DB, security, integrations
│   ├── migrations/          # Alembic revisions
│   └── tests/               # Backend tests
├── frontend/
│   └── src/
│       ├── Pages/           # Route-level screens
│       ├── components/      # Shared UI and layout
│       ├── context/         # Global React providers
│       ├── hooks/           # Domain workflows
│       └── lib/             # Shared client and domain API modules
├── docs/                    # Developer and engineering documentation
├── .github/workflows/       # GitHub Actions CI
├── docker-compose.yml
├── render.yaml
└── vercel.json
~~~

## Quick local start

Prerequisites: Python 3.13+, uv, Node.js compatible with Vite 8, npm. Full environment and troubleshooting notes are in [Setup and operations](docs/SETUP_AND_OPERATIONS.md).

Backend terminal:

~~~bash
cd server
cp .env.dev.example .env.dev
# Set a unique JWT_SECRET_KEY in .env.dev.
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
~~~

Frontend terminal:

~~~bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000 in .env.
npm ci
npm run dev
~~~

## Quality checks

Backend, from server/:

~~~bash
uv run pytest -q
~~~

Frontend, from frontend/:

~~~bash
npm test
npm run lint
npm run build
~~~

These are the available commands, not a claim that the latest commit has passed them. Check the GitHub Actions run for the exact commit being reviewed.

## Branch and release workflow

- dev is the integration/testing branch.
- Create task branches from the latest dev.
- Use pull requests and wait for CI.
- Promote to main only after review and explicit release approval.
- Never commit secrets or force-push shared history.

## Security

Never commit real credentials. Values in .env.example files are placeholders. Rotate any secret that has been exposed; removing it from the latest commit does not invalidate it.
