# ALIMERIQ Infrastructure Provider Portal — Implementation Plan

**Source of truth:** `/UI_wireframes/*.html` (visual/behavioral spec). Existing code: `/frontend` (Vite + React 19), `/server` (FastAPI + SQLAlchemy 2.0 async + Alembic). This plan follows existing conventions and introduces no new frameworks.

---

## 1. Current-state summary

### Stack & versions
| Layer | Framework / lib | Version | Status |
|---|---|---|---|
| Frontend build | Vite | ^8.3.0 | Present |
| Frontend framework | React | ^19.2.8 | Present |
| Router | react-router-dom | ^7.18.4 | Present (lazy routes + `ProtectedRoute`) |
| Styling | Tailwind CSS | ^4.3.3 (`@tailwindcss/vite`) | Present |
| HTTP client | axios | ^1.20.0 | Present (`lib/client.js`, `withCredentials`) |
| Data-fetching | none (axios + ad-hoc SWR cache in `lib/client.js`) | — | Missing (no TanStack Query / SWR package) |
| Icons | lucide-react | ^1.52.0 | Present |
| Charts | recharts | ^3.10.1 | Present |
| Schema validation | zod | ^3.22.4 | Present |
| Fonts | Fraunces + Plus Jakarta Sans (index.css) | — | Present; wireframes specify Fraunces headings + **Inter** body |
| Backend | FastAPI | >=0.142.2 | Present (`main.py` app factory + lifespan) |
| Backend Python | Python | >=3.13 | Present |
| ORM | SQLAlchemy 2.0 async (DeclarativeBase, `async_sessionmaker`) | — | Present (`core/db.py`, `models/base.py`) |
| Migrations | Alembic | >=1.20.0 | Present (`alembic.ini`, `migrations/env.py`, `migrations/versions/`) |
| DB driver | `aiosqlite` for dev/testing (SQLite file), `asyncpg`/`psycopg[binary]` for prod Postgres (Neon) | — | Present (`core/db.py` normalizes to `postgresql+psycopg`); dialect-neutral |
| Auth | bcrypt + PyJWT + HttpOnly cookie (`COOKIE_NAME=auth_token`) | — | Present (`core/security.py`, `api/dependencies.py`) |
| Email | Resend | — | Present |
| Cache/rate | Upstash Redis (optional, in-memory fallback) | — | Present (`core/redis_client.py`) |

### What exists
- Frontend: `App.jsx` with `Routes` + lazy `lazyWithRetry`, `Layout` (sidebar at `lg+`, mobile drawer, header), `AppSidebar` (`WORKSPACE_NAV`, `FOUNDER_STUDIO_NAV`), `ProtectedRoute` (redirects to `/login`, runs `OnboardingWizard` when `!onboarding_completed`), `AuthContext` (JWT in HttpOnly cookie, `localStorage` mirror of `almeriq_user`), `useAuth`, `lib/api.js` barrel, `lib/client.js` (axios instance + `extractErrorMessage` + 60s SWR/ETag cache), pages (`LoginPage`, `SignupPage`, `DashboardPage`, `SettingsPage`, …), `index.css` (dark base `#0a0a0b`, `.alq-input`, `.alq-submit`, `.font-display`=Fraunces, `.font-body`=Plus Jakarta Sans).
- Server: `main.py` (CORS, GZip, routers: health, waitlist, auth, founder, admin), `core/{config,db,security,redis_client,gemini}.py`, `models/{base,user,founder_*,waitlist,company_guide}`, `schemas/{auth,founder,waitlist}`, `repositories/{user,founder_*,waitlist,company_guide}`, `services/{auth,founder,founder_prompts,waitlist,company_guide}`, `api/routers/{auth,founder,waitlist,admin,health}`, `api/dependencies.py` (`get_current_user`, `get_current_admin_user`), Alembic env + 8 existing migrations (base revision `1f63d573c728` = users + waitlist).

### What is missing (provider domain)
- No provider models: `ProviderProfile`, `Asset`, `CoverageRegion`, `Order`, `OrderEvent`, `Deal`, `Conversation`, `Message`, `Notification`.
- No provider routers/services/repositories/schemas.
- No provider role enforcement (`role` exists on `User` but `INFRASTRUCTURE_PROVIDER` is not wired).
- No provider frontend screens/components (marketplace, listings, orders, checkout, chat, alerts, gallery).
- No data-fetching library beyond axios (optional; axios is sufficient — no addition required).
- No new frameworks required. `axios`, `react-router-dom`, `tailwindcss`, `lucide-react`, `recharts` already cover routing, styling, icons, charts. If a decision is made later to replace the ad-hoc SWR cache, add `@tanstack/react-query` (reason: dedicated cache/invalidation for listings & orders). Not required now.

---

## 2. Screen inventory

Each provided wireframe mapped to a route, purpose, data shown, and actions. Route names are proposed; they follow existing frontend convention (path-based, `react-router-dom`).

| Wireframe | Route | Purpose | Data shown | Key actions |
|---|---|---|---|---|
| `infrastructureproviderprofilesetup.html` | `/provider/setup` (onboarding wizard, 5 steps) | Provider onboarding: register company/person, physical/digital assets, coverage, engagement preferences | Step tracker (1 Provider Info, 2 Physical, 3 Digital, 4 Coverage, 5 Preferences); provider name, location, type (Individual/Company), about; physical asset drafts; digital assets; coverage regions (Africa, Asia-Pacific, Europe, Latin America, Middle East, North America, Global); engagement/client criteria | Save Draft, Preview, Add physical asset, Add digital asset, Remove asset, Save & Preview Listing, Close Preview |
| `infrastructuremarketplace.html` | `/marketplace` | Browse & rent/buy verified infrastructure | Hero stats (Active Fleet 1,420 Nodes, Escrow Pool 99.8%, Routing Turnkey SLA); category grid (All 142, Trucks, Satellites, Generators, Excavators, Containers, Solar Arrays); listing cards (provider, verified badge, location, ONLINE status, description, specs, price/mo); Advanced Filters, search | View listing, Chat, Order (add to cart), filter categories, Advanced Filters, Reset filters, Request Procurement |
| `5-stepcheckout.html` | `/checkout/:orderId` (deal flow) | Reserve infrastructure via escrow; 5 steps | Stepper: 1 Payment, 2 Amount, 3 Confirm, 4 Sign, 5 Complete; payment-method tiles (PayPal, Mastercard, Visa ending 4821, M-Pesa); amount presets ($5,000 / $14,500 / custom); PCI-DSS note; signature canvas | Choose payment method, set/adjust amount, confirm amount, sign deal (draw signature + Clear), Done |
| `mylisting.html` | `/provider/listings` | Manage own listings / asset fleet | Asset cards grouped by status (AVAILABLE / RESERVED / UNAVAILABLE); asset name, category, specs, price/mo, telemetry chips (14 NODES PINGING, ORBIT SYNCH 100%); status filter chips (All/Physical/Digital, Available/Reserved/Unavailable) | Add asset, Edit, Pause listing, Duplicate spec, Delete, Save asset, search, status filters |
| `orders.html` | `/provider/orders` | Order lifecycle & escrow fulfillment | Stats (Total Orders +3 this wk, Pending Review Action Req, In Transit/Deployed GPS Ping OK, Escrow Vault Volume $284,500 100% Bonded); Live Order Ledger table (Order ID, Client/Venture, Infrastructure Item, Allocation, Lease Amount, Status, Timestamp); status tabs (All/Pending/Confirmed/Shipped/Completed) | Confirm Order, Decline, Mark as Shipped & Attach Waybill, MANUAL DISPATCH, Export CSV, Filters, Chat with Rep, search, Switch Status Preview |
| `providerdashboard.html` | `/provider/dashboard` | Provider overview / command center | Greeting + provider name; health chips (CORE CLUSTER LIVE, GATEWAY EU-WEST-1A, LATENCY 14ms); metric cards (Active Listings, Open Orders 1 awaiting review, Unread Enquiries 3 high priority, Revenue This Month $48,250 +14.2%); Recent Client Orders table (Client Entity, Allocated Asset, Amount, Status, Action) | Export Report, + Add Asset, Review Order, search |
| `your infrastructurelisting.html` | `/listings/:id` (public preview) / `/provider/listings/:id/preview` | Public listing detail seen by founders/companies | Provider name, verified badge, location, ENCLAVE KEY, About the Provider, Allocated Provisioning Assets (physical + digital cards with price/mo, specs, telemetry status), Live Preview Mode / Unlisted Draft badge | Continue & Publish, Edit Listing |

### Missing wireframes (planned from behavior, not HTML)

| Screen | Route | Planned behavior |
|---|---|---|
| Account creation | `/signup`, `/onboarding` (role step) | Extend existing OTP signup (send-otp → verify-otp → complete) with a role step selecting `INFRASTRUCTURE_PROVIDER`; post-signup flows into `/provider/setup`. Reuses existing `api/routers/auth.py` + `lib/api/auth.js`. |
| Gallery modal | modal over `/marketplace` (triggered from listing card "View") | Carousel of a provider's infrastructure items: left/right arrows, image counter (x of N), thumbnail strip, keyboard (arrow keys / Esc) + swipe support; closes on backdrop click or close button. No dedicated backend endpoint beyond listing images attached to `Asset`. |
| Chat | `/messages` + right drawer (full screen below `md`) | Inbox list state (conversations) on the left/collapsed; right drawer shows message bubbles (sent/received), composer with send; opens from listing card "Chat" / orders "Chat with Rep". Persisted via `Conversation`/`Message` models. |
| Search | `/search` | Category grid first; results page with filters (location, type, availability, price); results feed from marketplace listings API. |
| Alerts | `/alerts` | Notification list; unread dot per item; "Mark all as read" action. Backed by `Notification` model. |

---

## 3. Design tokens (Tailwind theme)

**Compliant with `.agents/rules/ui-styling-standards.md`:** strict White, Gold, and Black palette only. No emerald, rust, muted, faint, or gray text colors. No em/en dashes in UI copy.

**Colors**
- `bg`: `#0A0A0B` (page background, dark charcoal)
- `surface`: `#141417` (cards/elevated containers)
- `surface-2`: `#1C1C21` (inputs, secondary surfaces)
- `border`: `#2B2B31` (dividers)
- `gold`: `#C9A15A` (primary accent, active states)
- `gold-soft`: `#E8D6A8` (active text on gold)
- `text`: `#F3F1EC` / `text-white` (body text — pure white, NOT gray)
- `text-muted`: `text-white/70` (minor secondary labels only)
- `text-faint`: `text-white/60` (tertiary text only)
- selection: `bg-gold/20`, `text-gold-soft`

**Typography**
- Headings: `Fraunces` (serif), weights 400–700, opsz 9..144
- Body/UI: `Inter` (sans), weights 300–700
- Monospace (telemetry/labels): JetBrains Mono

**Border radius**
- `lg`: 8px, `xl`: 12px, `2xl`: 16px

**Punctuation**: Never use em dashes (—) or en dashes (–). Use hyphens (-) only. Simple everyday English.

**Tailwind theme extension (to add to `frontend/src/index.css` or a Tailwind v4 theme block)**

```css
@theme {
  --color-bg: #0A0A0B;
  --color-surface: #141417;
  --color-surface-2: #1C1C21;
  --color-border: #2B2B31;
  --color-gold: #C9A15A;
  --color-gold-soft: #E8D6A8;
  --color-text: #F3F1EC;
  --font-serif: "Fraunces", serif;
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-2xl: 16px;
}
```

Import `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Inter:wght@300;400;500;600;700&display=swap`.

---

## 4. Shared component list (deduplicated)

Build once in `frontend/src/components/ui/` and reuse across all provider screens.

| Component | Purpose / variants | Responsive behavior |
|---|---|---|
| `AppShell` | Frame: sidebar + header + main outlet | Sidebar fixed left at `lg+` (`w-64` / collapsible `w-[68px]` icon rail); icon rail `md–lg`; bottom tab bar below `md` (Dashboard, Listings, Orders, Marketplace, Alerts) |
| `Modal/Sheet` | Centered modal and edge sheet | Overlay with backdrop; Esc to close; trap focus |
| `Drawer` | Slide-over panel | Right drawer full width below `md`, fixed-width side drawer at `md+` |
| `DataTable` | Listing/orders ledger | Full `<table>` at `lg+`; stacked attribute cards below `md` |
| `Card` | Asset/listing/metric container | `surface` bg, `border`, `rounded-2xl` |
| `Pill` | Category/status chip | `rounded-full`, `text-xs`, gold/white variants only (no emerald/rust/muted) |
| `StatusPill` | Status badge | All statuses use gold/white only — Available (gold), Reserved (gold), Unavailable/Pending (white/60) — no emerald or rust colors |
| `Button` | Primary (gold), ghost, destructive (rust), icon | `rounded-xl`, `tap-target` min-height 44px |
| `Input` | Text/email/number/textarea | `surface-2` bg, `border` focus → gold, rust on invalid |
| `Stepper` | 5-step progress | Horizontal bar `xl+`, compact segmented bar below `lg` (per checkout/setup wireframes) |
| `EmptyState` | Illustration + CTA for no data | Surface card, muted text, primary button |
| `Skeleton` | Loading shimmer | Pulse animation on `surface-2` blocks |

Existing components to reuse/conform: `ConfirmModal`, `Skeletons.jsx`, `BrandLogo`, `AppSidebar`, `HeaderNavigation`, `Layout`, `ProtectedRoute`.

---

## 5. Database models & Alembic migration plan

All models extend `models/base.py` (`DeclarativeBase`) and use `Mapped[mapped_column(...)]`, `DateTime(timezone=True)` with `default=lambda: datetime.now(timezone.utc)`, `to_dict()` pattern. Repositories follow `repositories/user.py` (accept optional `session`, `session.add` + `flush` or `commit`+`refresh`, `returning(User)` for updates).

### Models (new files under `server/models/`)
- `provider_profile.py` — `ProviderProfile`: id PK, user_id FK→users (unique), company_name, trading_name, provider_type (individual|company), location, about (text), verified (bool default false), enclave_key (text), created_at/updated_at.
- `asset.py` — `Asset`: id PK, provider_id FK→provider_profiles, name, category, kind (physical|digital), description, specs (jsonb), price_monthly (numeric), quantity_capacity, status (available|reserved|unavailable), telemetry_url, is_active (bool), created_at/updated_at. Indexes: provider_id, kind, status.
- `coverage_region.py` — `CoverageRegion`: id PK, provider_id FK, region (enum-ish text: africa|asia_pacific|europe|latin_america|middle_east|north_america|global), created_at. Unique (provider_id, region).
- `order.py` — `Order`: id PK, order_id (unique text, e.g. ORD-9082), client_id FK→users, provider_id FK→provider_profiles, asset_id FK→assets, allocation (text), lease_amount (numeric), status (pending_review|confirmed|shipped|completed|declined), created_at/updated_at.
- `order_event.py` — `OrderEvent`: id PK, order_id FK→orders, event_type (text), actor_id FK→users, note (text), created_at.
- `deal.py` — `Deal`: id PK, order_id FK→orders (unique), payment_method (text), amount (numeric), signature (text, data URL), signed_at (timestamp nullable).
- `conversation.py` — `Conversation`: id PK, participant_a_id FK→users, participant_b_id FK→users, created_at/updated_at. Unique (participant_a, participant_b) ordered.
- `message.py` — `Message`: id PK, conversation_id FK→conversations, sender_id FK→users, body (text), read_at (timestamp nullable), created_at.
- `notification.py` — `Notification`: id PK, user_id FK→users, type (text), title, body, read (bool default false), link (text), created_at.

### User model changes
- `role`: default `user`; add `INFRASTRUCTURE_PROVIDER` as a valid value (application-level check; keep `Text` column to avoid enum migration churn).

### Alembic migration plan
Existing base revision: `1f63d573c728` (users, waitlist). Plan new migrations in `server/migrations/versions/`, each using `op.execute(""" CREATE TABLE IF NOT EXISTS ... """)` + `CREATE INDEX IF NOT EXISTS`, matching the existing migration style (raw SQL inside `op.execute`, `IF NOT EXISTS`, safe `ALTER ... ADD COLUMN IF NOT EXISTS`).

Dev/testing database: SQLite file (`almeriq_dev.db`) referenced via `DATABASE_URL=sqlite+aiosqlite:///./almeriq_dev.db` in `.env.dev`. After deployment, switch `DATABASE_URL` to the prod Postgres/Neon URL so the same code and migrations run against prod.

1. `001_add_provider_domain_tables.py` — down_revision `1f63d573c728`. Creates `provider_profiles`, `assets`, `coverage_regions`, `orders`, `order_events`, `deals`, `conversations`, `messages`, `notifications` with FKs and indexes. Downgrade drops all in reverse dependency order (`CASCADE`).
2. (Optional, later) `002_provider_role_index.py` — index on `users(role)` and any provider-only columns.

Migrations must be independently runnable: `alembic upgrade head` and `alembic downgrade <base>` must succeed against an empty DB and against the existing DB. Dialect-neutral: generic `Uuid`, `JSON`, `Numeric`, `DateTime(timezone=True)`, strings instead of native enums (`native_enum=False`), no ARRAY, no raw dialect-specific SQL.

### Simulated payments
Payment gateways are not wired. The deal flow (`/checkout`) simulates PayPal, card, and M-Pesa payment methods: selecting a method records `payment_method` on the `Deal`, no real card numbers are stored, and the flow completes through the 5-step stepper (Payment → Amount → Confirm → Sign → Done). `signed_at` is set when the user signs.

---

## 6. REST API contract

Conventions: routers mount at `/api` (double-registered `/auth` + `/api/auth` in existing auth router — keep that pattern for new provider routers or pick one prefix consistently). Schemas in `server/schemas/` (Pydantic v2, `from_attributes = True`), `api/routers/<domain>.py`, `services/<domain>.py`, `repositories/<domain>.py`. Auth: `get_current_user` (HttpOnly cookie + Bearer fallback). Provider guard: new dependency `get_current_provider_user` (403 if `role != INFRASTRUCTURE_PROVIDER`).

| # | Method | Path | Request schema | Response schema | Auth | Screen | Layers |
|---|---|---|---|---|---|---|---|
| A1 | POST | `/api/auth/signup/complete` | SignupCompleteRequest (+signup_token cookie) | AuthMessageResponse | none (cookie) | Account creation | api/routers/auth, services/auth, repositories/user, schemas/auth, models/user |
| A2 | POST | `/api/auth/onboarding` | UserOnboardingRequest (incl. `role`) | AuthMessageResponse | cookie | Account creation / provider setup | api/routers/auth, services/auth, repositories/user |
| A3 | GET | `/api/auth/me` | — | UserResponse | cookie | All (session) | api/routers/auth, services/auth, repositories/user |
| P1 | GET | `/api/provider/profile` | — | ProviderProfileResponse | cookie + provider | providerdashboard, mylisting | api/routers/provider, services/provider, repositories/provider_profile, schemas/provider, models/provider_profile |
| P2 | PUT | `/api/provider/profile` | ProviderProfileUpdateRequest | ProviderProfileResponse | cookie + provider | provider setup | api/routers/provider, services/provider, repositories/provider_profile |
| P3 | GET | `/api/provider/assets` | query: status, kind | AssetListResponse | cookie + provider | mylisting | api/routers/asset, services/asset, repositories/asset, schemas/asset, models/asset |
| P4 | POST | `/api/provider/assets` | AssetCreateRequest | AssetResponse | cookie + provider | mylisting / setup | api/routers/asset, services/asset, repositories/asset |
| P5 | GET/PUT/DELETE | `/api/provider/assets/:id` | AssetUpdateRequest | AssetResponse / 204 | cookie + provider (ownership check) | mylisting | api/routers/asset, services/asset, repositories/asset |
| P6 | GET/POST | `/api/provider/coverage-regions` | CoverageRegionCreateRequest | CoverageRegionListResponse | cookie + provider | provider setup | api/routers/coverage, services/coverage, repositories/coverage_region |
| M1 | GET | `/api/marketplace/listings` | query: category, location, type, availability, min_price, max_price, search | MarketplaceListingListResponse | none (public) | marketplace, search | api/routers/marketplace, services/marketplace, repositories/asset+provider_profile |
| M2 | GET | `/api/marketplace/listings/:id` | — | MarketplaceListingDetailResponse (incl. gallery images) | none | marketplace (gallery modal) | api/routers/marketplace |
| M3 | GET | `/api/search` | query: q, category, location, type, availability, price | SearchResultResponse | none | search | api/routers/search, services/search |
| O1 | GET | `/api/provider/orders` | query: status | OrderListResponse | cookie + provider | orders | api/routers/order, services/order, repositories/order, schemas/order, models/order |
| O2 | GET | `/api/provider/orders/:id` | — | OrderDetailResponse (+ events) | cookie + provider (ownership) | orders detail | api/routers/order |
| O3 | PATCH | `/api/provider/orders/:id/status` | OrderStatusUpdateRequest | OrderResponse | cookie + provider (ownership) | orders (Confirm/Decline/Shipped) | api/routers/order, services/order, repositories/order_event |
| O4 | POST | `/api/provider/orders/:id/waybill` | WaybillUploadRequest | OrderResponse | cookie + provider | orders | api/routers/order |
| D1 | POST | `/api/deals` | DealCreateRequest | DealResponse | cookie + provider | checkout | api/routers/deal, services/deal, repositories/deal |
| D2 | GET | `/api/deals/:id` | — | DealResponse | cookie + provider | checkout | api/routers/deal |
| D3 | POST | `/api/deals/:id/sign` | DealSignRequest (signature) | DealResponse | cookie + provider | checkout (sign step) | api/routers/deal |
| C1 | GET | `/api/conversations` | — | ConversationListResponse | cookie | chat (inbox) | api/routers/conversation, services/conversation, repositories/conversation |
| C2 | GET | `/api/conversations/:id/messages` | — | MessageListResponse | cookie | chat | api/routers/message, services/message, repositories/message |
| C3 | POST | `/api/conversations/:id/messages` | MessageCreateRequest | MessageResponse | cookie | chat (composer) | api/routers/message |
| N1 | GET | `/api/notifications` | query: unread_only | NotificationListResponse | cookie | alerts | api/routers/notification, services/notification, repositories/notification |
| N2 | PATCH | `/api/notifications/read-all` | — | { count } | cookie | alerts ("mark all as read") | api/routers/notification |

Ownership rule enforcement: asset/order/conversation endpoints filter by `provider_id == current_user.provider_profile.id` (or order belongs to provider's assets) in the repository/service layer, returning 404/403 otherwise — never expose another provider's rows.

---

## 7. Role rules

- `User.role` values: `user`, `INFRASTRUCTURE_PROVIDER`, `admin`.
- **Only `INFRASTRUCTURE_PROVIDER` users** may access: `/provider/*`, `/provider/dashboard`, `/provider/listings`, `/provider/orders`, `/checkout/*`, `/setup`, gallery-as-provider, chat-as-provider.
- Providers read/write **only their own** listings/assets/orders: every provider-scoped repository query adds `WHERE provider_id = (SELECT id FROM provider_profiles WHERE user_id = current_user.id)`; cross-provider access returns 404.
- Public (no auth): marketplace listing browse, search, public listing preview `/listings/:id`.
- Auth required (any role): chat, alerts, checkout initiation (though checkout semantically provider-side here).
- Admin: existing `get_current_admin_user` unchanged; admin routes unaffected.

New dependency (add to `server/api/dependencies.py`):

```python
async def get_current_provider_user(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "INFRASTRUCTURE_PROVIDER":
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Provider account required")
    return current_user
```

Frontend guard: new `ProviderRoute` wrapper (like `ProtectedRoute`) checking `user.role === "INFRASTRUCTURE_PROVIDER"`, redirecting non-providers to `/dashboard` or 403 page.

---

## 8. Pending client confirmation

The following screens are **assumed** (not present in the original client artifact) and should be confirmed with the client before build:
- Provider dashboard (`/provider/dashboard`)
- Listings management (`/provider/listings`)
- Orders list & order detail (`/provider/orders`, `/provider/orders/:id`)
- Messages inbox + chat drawer (`/messages`)

All other screens derive directly from wireframes.

---

## 9. Milestones (each independently runnable)

Each milestone delivers a verifiable slice (backend API + frontend screens + lint/typecheck equivalent) and can be merged/tested on its own.

| Milestone | Deliverable | Independently runnable check |
|---|---|---|
| **M1 — Shell & design system** | Tailwind theme (tokens §3), shared components (§4), `AppShell` with provider nav (Dashboard/Listings/Orders/Marketplace/Alerts), `ProviderRoute` guard, bottom tab bar below `md`. | `npm run lint` clean; visual smoke test of shell on all routes; no backend changes. |
| **M2 — Account creation (provider role)** | Extend signup OTP flow with role selection `INFRASTRUCTURE_PROVIDER`; `/signup` → `/onboarding` role step → `/provider/setup`. Frontend + existing auth backend. | Register a provider account, confirm `role` persisted, `/auth/me` returns role. |
| **M3 — Provider profile + domain models** | Models + migration `001` (§5), profile/assets/coverage APIs (§6 P1–P6), provider setup wizard UI (5 steps, Save Draft/Preview). | `alembic upgrade head` on empty DB; create provider + assets via API; UI submits setup. |
| **M4 — Marketplace & listings** | Marketplace browse, category grid, filters, listing detail, gallery modal, search page; APIs M1–M3 + assets public read. | Browse listings, open gallery modal, filter results; API returns public data without auth. |
| **M5 — Orders & checkout/deal** | Orders list/detail, status transitions, waybill, checkout 5-stepper, deal + signature; APIs O1–O4, D1–D3. | Create order, confirm/decline/ship, sign deal, signature persisted. |
| **M6 — Chat, alerts, search polish** | Conversations/message CRUD, notifications list + mark-all-read, inbox drawer; APIs C1–C3, N1–N2. | Send/receive message, notification unread dot, mark all as read. |

Order note: M3 depends on M2 (provider role); M4–M6 depend on M3 (assets/profiles). Within a milestone, backend and frontend can be verified separately.

---

**Next step:** review PLAN.md; once confirmed, implementation begins with M1 (no application code written yet).