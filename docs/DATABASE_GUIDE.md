# Database, Data Model and Migration Guide

## 1. Database runtime

The backend uses SQLAlchemy 2 asynchronous sessions.

- Engine and session factory: `server/core/db.py`.
- Settings and connection string: `server/core/config.py`.
- Alembic environment: `server/migrations/env.py`.
- Model registry: `server/models/__init__.py`.
- Migration scripts: `server/migrations/versions/`.

The default development URL is SQLite: `sqlite+aiosqlite:///./almeriq_dev.db`. The production deployment configuration expects a PostgreSQL URL; the repository references Neon as a PostgreSQL provider.

PostgreSQL URL schemes are normalized to `postgresql+psycopg` for the SQLAlchemy engine and Alembic. PostgreSQL connections use SSL mode `require` when the URL does not already specify an SSL mode.

A request-scoped `get_db` dependency yields an `AsyncSession`, commits after a successful request, and rolls back when an exception escapes the dependency. The session factory uses `expire_on_commit=False` and `autoflush=False`.

## 2. Entity map

The diagram shows the major foreign-key relationships in the current model definitions. It is intentionally a domain-level map, not every scalar column or index.

~~~mermaid
erDiagram
    USERS ||--o{ FOUNDER_VENTURES : owns
    USERS ||--o| FOUNDER_VALIDATION : owns
    USERS ||--o{ FOUNDER_LEGAL_FILINGS : owns
    USERS ||--o{ FOUNDER_AI_CACHE : owns
    USERS ||--o| PROVIDER_PROFILES : has
    PROVIDER_PROFILES ||--o{ ASSETS : lists
    PROVIDER_PROFILES ||--o{ COVERAGE_REGIONS : covers
    PROVIDER_PROFILES ||--o{ JOB_POSTINGS : may_own
    USERS ||--o{ JOB_POSTINGS : may_own
    USERS ||--o| JOB_SEEKER_PROFILES : has
    USERS ||--o{ JOB_APPLICATIONS : submits
    JOB_POSTINGS ||--o{ JOB_APPLICATIONS : receives
    USERS ||--o| INVESTOR_PROFILES : has
    USERS ||--o{ STARTUP_PITCHES : publishes
    STARTUP_PITCHES ||--o{ INVESTMENTS : receives
    USERS ||--o{ INVESTMENTS : makes
    STARTUP_PITCHES ||--o{ INVESTOR_UPDATES : has
    USERS ||--o{ INVESTOR_UPDATES : authors
    USERS ||--o| EXPERT_PROFILES : has
    USERS ||--o{ ADVISORY_REQUESTS : founder
    USERS ||--o{ ADVISORY_REQUESTS : expert
    USERS ||--o{ TEAM_INVITATIONS : invites
    USERS ||--o{ TEAM_INVITATIONS : receives
    USERS ||--o{ TEAM_MEMBERSHIPS : founder
    USERS ||--o{ TEAM_MEMBERSHIPS : member
    TEAM_INVITATIONS ||--o| TEAM_MEMBERSHIPS : accepted_as
    USERS ||--o{ ORDERS : client
    PROVIDER_PROFILES ||--o{ ORDERS : provider
    ASSETS ||--o{ ORDERS : ordered
    ORDERS ||--o{ ORDER_EVENTS : history
    USERS ||--o{ ORDER_EVENTS : actor
    ORDERS ||--o| DEALS : deal
    USERS ||--o{ CONVERSATIONS : participant
    CONVERSATIONS ||--o{ MESSAGES : contains
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ PROVIDER_VERIFICATION_EVENTS : reviewed
    PROVIDER_PROFILES ||--o{ PROVIDER_VERIFICATION_EVENTS : history
~~~

The relationship diagram reflects foreign keys and the domain's intended use. Confirm cardinality and delete behavior from the individual model files before changing schema or writing a data migration.

## 3. Table catalogue

| Domain | Tables | Main ownership / relationship |
|---|---|---|
| Identity | `users`, `waitlist` | Users are the central identity records; waitlist is a separate pre-registration record. |
| Founder workspace | `founder_ventures`, `founder_validation`, `founder_legal_filings`, `founder_ai_cache`, `company_registration_guides` | Founder records are associated with a user; registration guides are reference data. |
| Provider marketplace | `provider_profiles`, `provider_verification_events`, `assets`, `coverage_regions` | One provider profile per user; assets, regions and verification history belong to a provider. |
| Orders | `orders`, `order_events`, `deals` | Orders connect client, provider and asset; events record order history; deal is one-to-one with an order. |
| Messaging | `conversations`, `messages`, `notifications` | Conversations connect two users; messages belong to a conversation and sender; notifications belong to a user. |
| Jobs | `job_postings`, `job_applications`, `job_seeker_profiles` | A job can be provider-owned or founder-owned; applications connect job and applicant. |
| Investor | `investor_profiles`, `startup_pitches`, `investments`, `investor_updates` | Investor profiles belong to users; pitches and updates belong to founders; investments connect investors and pitches. |
| Expert | `expert_profiles`, `advisory_requests` | One expert profile per user; advisory requests connect founder and expert users. |
| Team | `team_invitations`, `team_memberships` | Both reference founder and invitee/member users; membership also references its invitation. |

For exact fields, defaults, indexes, unique constraints and on-delete behavior, inspect the model named after the table in `server/models/`. Do not infer schema from frontend forms alone.

## 4. Important constraints and implementation details

- A provider profile is unique per user.
- An expert profile is unique per user; its expertise is stored as JSON text in `expertise_json`.
- An investor profile is unique per user; several preference collections are stored as JSON text columns.
- A job seeker profile is unique per user; skills, experience, education, certifications, projects and preferences are stored as JSON text.
- An asset's optional `client_asset_id` is unique within a provider (composite unique index).
- A provider cannot repeat the same coverage region (composite unique constraint).
- A job application is unique per job posting and applicant.
- A job posting supports either a provider profile owner or a founder user owner. Check its CheckConstraint and service validation before changing owner logic.
- A founder can have at most one membership for the same member; a team invitation is unique for a founder/invitee pair.
- A conversation has a unique ordered pair of participant IDs. Check the conversation service's participant normalization so the same pair is not represented in both orders.
- A deal is unique per order.
- Foreign keys frequently use `ON DELETE CASCADE`; provider verification reviewer references use `SET NULL`. A delete can therefore remove substantial dependent data.

## 5. Alembic revision graph

The migration history contains two branches from revision `d4f8c2b6e9a1`, which are joined by the explicit merge revision `19fc4425f2d3`.

~~~mermaid
flowchart TD
    A["1f63d573c728<br/>initial users + waitlist"]
    B["a8f2c1d04e9b<br/>OAuth password nullable"]
    C["c3e7b1a2f4d8<br/>repair users sequence"]
    D["d4f8c2b6e9a1<br/>align user profile fields"]
    E["9ccb43ac22ab<br/>founder ventures"]
    F["5ef9090b8f45<br/>founder validation/legal/cache"]
    G["23bd4400b379<br/>waitlist OTP"]
    H["6b1e8471c9d2<br/>company guides"]
    I["758e6570f549<br/>venture name"]
    J["001_add_provider_domain_tables"]
    K["002_add_jobs_domain"]
    L["003_add_investor_domain"]
    M["19fc4425f2d3<br/>merge provider + investor"]
    N["004_add_provider_engagement_prefs"]
    O["005 -> 006 -> 007<br/>asset ID/media + simulated deal payment"]
    P["008 -> 009<br/>job owner + seeker profile"]
    Q["010 -> 011 -> 012 -> 013 -> 014 -> 015 -> 016 -> 017 -> 018 -> 019 -> 020"]
    A --> B --> C --> D
    D --> E --> F --> G --> H --> I --> J
    D --> K --> L
    J --> M
    L --> M
    M --> N --> O --> P --> Q
~~~

The merge revision is intentionally a no-op migration whose purpose is to join the provider and investor branches. Do not delete it or rewrite its parents in a database that may already have recorded it.

## 6. Migration workflow

From `server/`:

~~~bash
# Inspect current database revision(s)
uv run alembic current

# Inspect migration graph and heads
uv run alembic history --verbose
uv run alembic heads

# Apply all migrations
uv run alembic upgrade head

# Compare ORM metadata against migration history (review output; do not auto-apply)
uv run alembic check
~~~

Before creating a migration:

1. Pull the latest `dev` and check `alembic heads`.
2. Read the current head and the relevant model plus `server/models/__init__.py`.
3. Register new models in `server/models/__init__.py`.
4. Generate a revision using `uv run alembic revision --autogenerate -m "short description"`.
5. Read the generated file line by line. Autogenerate does not reliably infer renames, data transformations, all constraints or safe defaults.
6. Test upgrade from a copy of the current schema and, where feasible, test downgrade on a disposable database.
7. Confirm only one intended head remains. If parallel branches are genuinely required, merge heads deliberately.
8. Add tests for data preservation, nullability, uniqueness, foreign-key behavior and both SQLite/PostgreSQL differences where relevant.

Never edit an already-deployed migration to repair a schema. Add a forward migration. Never run destructive downgrade operations on production as a debugging shortcut.

## 7. Startup and deployment migration behavior

The FastAPI lifespan in `server/main.py` runs an Alembic upgrade/check against the expected script heads before serving traffic. It logs the before/after migration state and refuses to serve if the migration check fails.

The Render blueprint also declares `uv run alembic upgrade head` as a pre-deploy command. These are two migration touchpoints. Understand the deployment lifecycle and database permissions before changing either. Do not remove the startup guard without replacing its safety guarantee.

The PostgreSQL Alembic environment has a special preflight that widens `alembic_version.version_num` to VARCHAR(255), because some revision identifiers exceed Alembic's default 32-character width. Preserve this behavior unless the migration history and production database are deliberately reconciled.

## 8. Backup and restore: operational procedure to establish

The repository does not contain a verified production backup schedule or restore runbook. The incoming maintainer must confirm these with the database provider/account owner before making schema changes:

- Identify the exact production database/provider, project, branch/instance and region.
- Confirm automatic backup/PITR retention and the last successful backup timestamp.
- Confirm who can initiate a restore and whether restore creates a separate branch/instance.
- Test a restore into a non-production database and validate row counts, migration revision and critical workflows.
- Record the secure owner/location for credentials and recovery access; do not place secrets in this repository.
- Before a risky schema/data migration, confirm a recent recoverable backup and a rollback/forward-fix plan.

Do not assume that a database provider's advertised backup feature is enabled for this particular project.

## 9. Data integrity and privacy cautions

- User records contain identity fields such as nationality and ID number. Do not use production user data in local fixtures, logs, screenshots or support tickets.
- OAuth users may have a null password hash; do not make the password column non-null without a migration strategy.
- Several JSON collections are stored in text columns. Validate and serialize them consistently in the service/schema layer.
- Monetary values use SQL Numeric columns in several domains. Avoid converting financial values through binary floating-point where exact decimal arithmetic is required.
- Cascading deletes may remove profiles, pitches, applications, orders or conversations. Prefer explicit soft-delete/retention policies if product requirements need them; confirm with the product owner before changing.
- Never export a production database to an unencrypted developer laptop or attach it to an issue/PR.

## 10. Database change checklist

- [ ] Confirm production database identity and current migration revision.
- [ ] Confirm backup/PITR availability and restore access.
- [ ] Review all foreign keys, unique constraints, indexes and delete actions.
- [ ] Update model and Pydantic schema where required.
- [ ] Register model in `models/__init__.py`.
- [ ] Generate and manually review migration.
- [ ] Test SQLite and PostgreSQL behavior where applicable.
- [ ] Add authorization and data-integrity tests.
- [ ] Confirm one Alembic head and successful upgrade from previous head.
- [ ] Update this guide and API/domain documentation if the contract changed.
