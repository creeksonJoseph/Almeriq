# ALMERIQ — Platform Contracts

Shared contracts across all portal workstreams. This document is the single
source of truth for database models, API endpoints, schemas, authorization
rules, ownership relationships, statuses, messaging, notifications, frontend
routes, and shared components.

All agents must conform to these contracts. Deviations require an update to
this document and coordination with the integration lead.

---

## 1. Database Models

All models extend `server/models/base.py` (`DeclarativeBase`) and use
`Mapped[mapped_column(...)]`, `DateTime(timezone=True)` with
`default=lambda: datetime.now(timezone.utc)`, and a `to_dict()` method.

### Core (existing, do not modify without integration approval)
| Model | Table | Key columns |
|-------|-------|-------------|
| User | `users` | id PK, email unique, hashed_password, full_name, role (default "user"), onboarding_completed, google_id, created_at, updated_at |
| Waitlist | `waitlist` | id PK, full_name, email unique, role, joined_at |

### Provider Domain (implemented on feat/marketplace-order-flow)
| Model | Table | Key columns |
|-------|-------|-------------|
| ProviderProfile | `provider_profiles` | id PK, user_id FK→users unique, company_name, trading_name, provider_type, location, about, verified, verified_at, verified_by, verification_reviewed_at, verification_reviewed_by, enclave_key, created_at, updated_at |
| Asset | `assets` | id PK, provider_id FK, name, category, kind (physical\|digital), description, specs JSON, price_monthly numeric, quantity_capacity, status, telemetry_url, is_active, client_asset_id, created_at, updated_at |
| CoverageRegion | `coverage_regions` | id PK, provider_id FK, region, created_at |
| Order | `orders` | id PK, order_id unique text, client_id FK→users, provider_id FK→provider_profiles, asset_id FK→assets, allocation text, lease_amount numeric, status (pending_review\|confirmed\|shipped\|completed\|declined), created_at, updated_at |
| OrderEvent | `order_events` | id PK, order_id FK→orders, event_type text, actor_id FK→users, note text, created_at |
| Deal | `deals` | id PK, order_id FK→orders unique, payment_method, amount numeric, signature text nullable, signed_at timestamp nullable |
| Conversation | `conversations` | id PK, participant_a_id FK→users, participant_b_id FK→users, created_at, updated_at, unique(participant_a, participant_b) ordered |
| Message | `messages` | id PK, conversation_id FK→conversations, sender_id FK→users, body text, read_at timestamp nullable, created_at |
| Notification | `notifications` | id PK, user_id FK→users, type text, title, body, read bool default false, link text, created_at |

### Job Domain (backend implemented on feat/marketplace-order-flow)
| Model | Table | Key columns |
|-------|-------|-------------|
| JobPosting | `job_postings` | id PK, provider_id FK→provider_profiles, title, description, role_type, location, remote bool, equity_min/max numeric, salary_min/max numeric, status (open\|closed\|draft), created_at, updated_at |
| JobApplication | `job_applications` | id PK, job_id FK→job_postings, applicant_id FK→users, cover_note text, status (pending\|reviewed\|shortlisted\|rejected\|hired), created_at, updated_at |
| JobSeekerProfile | `job_seeker_profiles` | id PK, user_id FK→users unique, headline, location, about text, skills JSON array, experience JSON array, education JSON array, certifications JSON array, portfolio_url, matching_preference text, created_at, updated_at |

### Investor Domain (backend implemented on feat/marketplace-order-flow)
| Model | Table | Key columns |
|-------|-------|-------------|
| InvestorProfile | `investor_profiles` | id PK, user_id FK→users unique, full_name, title, firm, bio text, years_investing int nullable, verification_link, industries JSON, stages JSON, check_min/max numeric nullable, regions JSON, lead_follow, notable_investments text, num_backed int, num_exits int, aum, value_add JSON, time_commitment, contact_pref, contact_format JSON, accredited bool, created_at, updated_at |
| StartupPitch | `startup_pitches` | id PK, founder_id FK→users, venture_id FK→founder_ventures nullable, title, deck_url text nullable, ask_amount/equity_offered numeric nullable, stage, status (draft\|active\|closed), created_at, updated_at |
| Investment | `investments` | id PK, investor_id FK→users, pitch_id FK→startup_pitches, amount numeric, payment_method, signature text nullable, signed_at timestamp nullable, status (pending\|signed\|completed), created_at |

### Founder Domain (backend partially implemented)
| Model | Table | Key columns |
|-------|-------|-------------|
| FounderVenture | `founder_ventures` | id PK, user_id FK→users, name, description, etc. |
| FounderAI Cache | `founder_ai_cache` | id PK, venture_id, cache data |
| Founder Legal | `founder_legal` | id PK, venture_id, legal data |
| Founder Validation | `founder_validation` | id PK, venture_id, validation data |

### Expert Domain (placeholder only — no model yet)

---

## 2. API Endpoints

All routers mount at `/api`. Auth uses JWT in HttpOnly cookies.

### Auth (existing)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | none | Register |
| POST | `/api/auth/login` | none | Login |
| POST | `/api/auth/logout` | cookie | Logout |
| GET | `/api/auth/me` | cookie | Current user |
| POST | `/api/auth/onboarding` | cookie | Set role |

### Provider (infrastructure_provider role)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/PUT | `/api/provider/profile` | cookie + provider | Profile |
| POST/GET | `/api/provider/assets` | cookie + provider | Assets |
| GET/PUT/DELETE | `/api/provider/assets/:id` | cookie + provider (ownership) | Asset CRUD |
| GET/POST | `/api/provider/coverage-regions` | cookie + provider | Coverage regions |
| GET | `/api/provider/orders` | cookie + provider | Orders |
| GET/PATCH | `/api/provider/orders/:id` | cookie + provider (ownership) | Order status |
| POST | `/api/provider/orders/:id/waybill` | cookie + provider | Waybill upload |

### Marketplace (public + authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/marketplace/listings` | none | Browse listings |
| GET | `/api/marketplace/listings/:id` | none | Listing detail |
| POST | `/api/marketplace/checkout` | cookie + founder | Create order and deal atomically |

### Orders (provider role)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/provider/orders` | cookie + provider | Paginated order list |
| GET | `/api/provider/orders/summary` | cookie + provider | All-time order counts for dashboard metrics |
| GET | `/api/provider/orders/:id` | cookie + provider (ownership) | Order detail |
| PATCH | `/api/provider/orders/:id/status` | cookie + provider (ownership) | Update status |
| POST | `/api/provider/orders/:id/waybill` | cookie + provider | Upload waybill |

### Deals (provider role)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/deals` | cookie + provider | Create deal |
| GET | `/api/deals/:id` | cookie + provider | Deal detail |
| POST | `/api/deals/:id/sign` | cookie + provider | Sign deal |

### Messaging (authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/conversations` | cookie | Paginated conversation list |
| GET | `/api/conversations/summary` | cookie | Inbox-wide unread conversation count |
| GET | `/api/conversations/:id/messages` | cookie | List messages |
| POST | `/api/conversations/:id/messages` | cookie | Send message |

### Notifications (authenticated)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications` | cookie | List notifications |
| PATCH | `/api/notifications/read-all` | cookie | Mark all read |

### Jobs (public list + founder create)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST | `/api/jobs` | none list / founder create | Job postings |
| GET/PUT/DELETE | `/api/jobs/:id` | founder (ownership) | Job CRUD |
| POST | `/api/jobs/:id/apply` | cookie (job_seeker) | Apply to job |
| GET | `/api/jobs/:id/applications` | cookie + founder | Applications |
| PATCH | `/api/jobs/:id/applications/:app_id` | cookie + founder | Update status |
| GET/PUT | `/api/job-seeker/profile` | cookie + job_seeker | Profile |

### Investor (public list + founder create)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/PUT | `/api/investor/profile` | cookie + investor | Profile |
| GET | `/api/startup-pitches` | none | List pitches |
| POST | `/api/startup-pitches` | cookie + founder | Create pitch |
| GET/PUT | `/api/startup-pitches/:id` | cookie + founder (ownership) | Pitch CRUD |
| POST | `/api/startup-pitches/:id/invest` | cookie + investor | Create investment |
| POST | `/api/investments/:id/sign` | cookie + investor | Sign investment |
| GET | `/api/investor/portfolio` | cookie + investor | Portfolio |

---

## 3. Authorization Rules

| Role | Can access |
|------|------------|
| `user` (default) | Public routes, dashboard, chat, notifications, checkout |
| `INFRASTRUCTURE_PROVIDER` | `/api/provider/*`, provider-owned deal and fulfillment actions |
| `JOB_SEEKER` | `/api/jobs/*` (apply), `/api/job-seeker/profile` |
| `INVESTOR` | `/api/investor/profile`, `/api/startup-pitches/:id/invest`, `/api/investments/:id/sign`, `/api/investor/portfolio` |
| `FOUNDER` | `/api/jobs/*` (create/manage own), `/api/startup-pitches/*` (create/manage own) |
| `EXPERT` | `/dashboard` (placeholder) |

Ownership enforcement:
- Assets/orders/conversations: filter by `provider_id == current_user.provider_profile.id`
- Jobs: founder can only manage their own job postings; job_seeker can only apply/view own applications
- Cross-provider access returns 404

---

## 4. Statuses

| Entity | Statuses |
|--------|----------|
| Order | pending_review, confirmed, shipped, completed, declined |
| JobApplication | pending, reviewed, shortlisted, rejected, hired |
| JobPosting | open, closed, draft |
| StartupPitch | draft, active, closed |
| Investment | pending, signed, completed |
| Deal | pending, signed, completed |
| JobSeekerProfile | n/a (completion %) |
| InvestorProfile | n/a (verification bool) |

---

## 5. Messaging & Notification Events

| Event | Trigger | Recipient |
|-------|---------|-----------|
| `created` | Order created | Provider |
| `status_changed` | Order status updated | Client + Provider |
| `waybill_uploaded` | Waybill uploaded | Client |
| `deal_created` | Deal created | Client + Provider |
| `deal_signed` | Deal signed | Provider |
| `message_sent` | New message | Conversation participants |
| `notification` | Generic notification | Target user |

Notification types: `order`, `deal`, `message`, `system`

---

## 6. Frontend Routes

| Path | Component | Auth | Role |
|------|-----------|------|------|
| `/` | LandingPage | none | all |
| `/login` | LoginPage | none | all |
| `/signup` | SignupPage | none | all |
| `/dashboard` | DashboardPage | ProtectedRoute | all authenticated |
| `/founder/intake` | FounderIntakePage | ProtectedRoute | founder |
| `/founder/analysis` | FounderAnalysisPage | ProtectedRoute | founder |
| `/founder/ventures` | VenturesPage | ProtectedRoute | founder |
| `/founder/validation` | FounderValidationPage | ProtectedRoute | founder |
| `/founder/product` | FounderProductPage | ProtectedRoute | founder |
| `/founder/legal` | FounderLegalPage | ProtectedRoute | founder |
| `/admin/waitlist` | AdminWaitlistPage | ProtectedRoute | admin |
| `/settings` | SettingsPage | ProtectedRoute | all authenticated |
| `/provider/setup` | ProviderSetupPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/dashboard` | ProviderDashboardPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/listings` | ProviderListingsPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/listings/:id/preview` | ProviderListingPreviewPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/listings/new` | ProviderAssetPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/listings/:id/edit` | ProviderAssetPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/orders` | ProviderOrdersPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/orders/:id` | ProviderOrderDetailPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/provider/orders/:id/dispatch` | ProviderDispatchPage | ProviderRoute | INFRASTRUCTURE_PROVIDER |
| `/job-seeker/dashboard` | JobSeekerDashboardPage | ProtectedRoute | JOB_SEEKER |
| `/job-seeker/setup` | JobSeekerSetupPage | ProtectedRoute | JOB_SEEKER |
| `/marketplace` | MarketplacePage | FounderRoute | all |
| `/listings/:id` | PublicListingPreviewPage | FounderRoute | all |
| `/search` | SearchPage | FounderRoute | all |
| `/alerts` | AlertsPage | ProtectedRoute | all authenticated |
| `/messages` | MessagesPage | ProtectedRoute | all authenticated |
| `/checkout/:orderId` | CheckoutPage | FounderRoute | all |

---

## 7. Shared Components (`frontend/src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| AppShell | Frame: sidebar + header + main outlet |
| Button | Primary (gold), ghost, destructive, icon |
| Card | Asset/listing/metric container |
| Input | Text/email/number/textarea |
| Pill | Category/status chip |
| StatusPill | Status badge |
| Stepper | Multi-step progress |
| EmptyState | Illustration + CTA for no data |
| Skeleton | Loading shimmer |
| ModalSheet | Centered modal / edge sheet |
| Drawer | Slide-over panel |
| DataTable | Listing/orders ledger |

---

## 8. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| bg | `#0A0A0B` | Page background |
| surface | `#141417` | Cards/elevated containers |
| surface-2 | `#1C1C21` | Inputs, secondary surfaces |
| border | `#2B2B31` | Dividers |
| gold | `#C9A15A` | Primary accent, active states |
| text | `#F3F1EC` | Body text (pure white) |

**Forbidden:** emerald, rust, muted, gray text colors. No em/en dashes — hyphens only.

**Fonts:** Fraunces (headings), Inter (body).

---

## 9. Migration Rules

- Every database schema change requires a new migration file.
- Never edit an already-applied migration to introduce a new schema change.
- Never generate conflicting migration heads independently.
- Use `op.create_table` with SQLAlchemy column definitions (dialect-compatible), not raw SQL with `AUTOINCREMENT`.
- Use `op.add_column` with `sa.Column` for additive changes.
- Use `op.create_index` / `op.drop_index` with `IF NOT EXISTS` / existence checks.
- All migrations must be dialect-neutral: no native enums, no ARRAY, no raw dialect SQL.
- Verify `alembic upgrade head` and `alembic downgrade <base>` against both SQLite and PostgreSQL.

---

## 10. API Rules

- Follow existing project conventions (router → service → repository → model).
- Use existing authentication and authorization dependencies.
- Validate inputs and responses with Pydantic v2 schemas (`from_attributes=True`).
- Enforce ownership at the backend, not only in frontend route guards.
- Use transactions for multi-step operations.
- Handle errors explicitly; do not expose internal database errors to clients.
- Never return fake success responses for unimplemented features.
