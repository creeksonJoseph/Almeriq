# ALIMERIQ Infrastructure Provider Portal

ALIMERIQ is an infrastructure leasing marketplace connecting providers of physical and compute assets with enterprise clients. This repository contains the full-stack provider portal: a FastAPI backend and a React/Tailwind frontend.

## Architecture

- **Backend**: FastAPI (Python 3.13), SQLAlchemy 2.0 async, Alembic migrations, SQLite dev / Postgres prod
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, React Hook Form, Zod
- **Auth**: JWT in HttpOnly Secure SameSite cookies, bcrypt password hashing
- **Architecture pattern**: Layered backend — router → service → repository → model

## Project Structure

```
Almeriq/
├── server/              # FastAPI backend
│   ├── api/routers/     # Route handlers (provider, asset, order, deal, etc.)
│   ├── services/        # Business logic
│   ├── repositories/    # Data access layer
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── core/db.py       # Database async engine & session
│   ├── migrations/      # Alembic migrations
│   ├── main.py          # App factory
│   ├── pyproject.toml   # uv-managed dependencies
│   └── scripts/smoke_test.sh  # Curl-based API smoke tests
├── frontend/            # React frontend
│   ├── src/Pages/       # Page components
│   ├── src/components/ui/  # Shared UI components
│   ├── src/lib/api/     # API client modules
│   ├── src/lib/client.js  # Shared Axios instance
│   ├── vitest.config.js   # Test config
│   └── package.json
├── docs/PLAN.md         # Implementation plan
├── docker-compose.yml   # Local dev with Docker
├── render.yaml          # Render deployment config
└── .env.dev.example     # Dev environment variables (example)
```

## Design Tokens

Strict palette (enforced by `.agents/rules/ui-styling-standards.md`):
- **White**: `#F3F1EC` (background) / `text-white`
- **Gold**: `#C9A15A` (accents)
- **Black**: `#0A0A0B` (text)

Forbidden: emerald, rust, muted, faint, gray text. No em/en dashes — use hyphens.

## Local Development

### Prerequisites

- Python 3.13 + [uv](https://github.com/astral-sh/uv)
- Node.js 20 + npm

### Backend

```bash
cd server
cp .env.dev.example .env.dev   # edit values as needed
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

Server runs at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`. Set `VITE_API_BASE_URL=http://localhost:8000` in `.env` if needed.

### Docker (both services)

```bash
docker compose up --build
```

Backend at `http://localhost:8000`, frontend at `http://localhost:5173`.

## Testing

### Backend smoke tests

```bash
cd server
bash scripts/smoke_test.sh
```

Curl-based tests covering auth, provider profile, assets, marketplace, search, orders, deals, conversations, notifications, and negative cases.

### Frontend unit tests

```bash
cd frontend
npm test
```

Vitest + React Testing Library. 14 tests across API client, UI components, and provider dashboard page.

### Lint

```bash
cd frontend
npm run lint
```

### Build

```bash
cd frontend
npm run build
```

## Environment Variables

### Backend (`.env.dev`)

```
DATABASE_URL=sqlite+aiosqlite:///./almeriq_dev.db
ENVIRONMENT=development
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend

```
VITE_API_BASE_URL=http://localhost:8000
```

`.env.dev` and `.env.prod` are gitignored. Examples are committed as `.env.dev.example` and `.env.prod.example` with placeholders. Never commit real secrets.

## Migrations

```bash
cd server
uv run alembic upgrade head     # apply all migrations
uv run alembic revision --autogenerate -m "description"  # create new migration
```

Dev DB uses SQLite (`almeriq_dev.db`). Production uses PostgreSQL/Neon via `DATABASE_URL`. All migrations are dialect-neutral (no native enums, no ARRAY, no raw dialect SQL).

## API Endpoints

41 endpoints registered. See `http://localhost:8000/openapi.json` for full spec.

Key areas:
- `POST /api/auth/register` / `/api/auth/login` / `/api/auth/logout` / `/api/auth/me`
- `POST /api/auth/onboarding` — set provider role
- `GET/PUT /api/provider/profile`
- `POST/GET /api/provider/assets`, `GET /api/provider/assets/{id}`
- `GET/POST /api/provider/coverage-regions`
- `GET /api/provider/orders`, `GET/PATCH /api/provider/orders/{id}`
- `POST /api/deals`, `GET/POST /api/deals/{id}/sign`
- `GET/POST /api/conversations`, `GET/POST /api/conversations/{id}/messages`
- `GET /api/notifications`, `PATCH /api/notifications/read-all`
- `GET /api/marketplace/listings`, `GET /api/search`
