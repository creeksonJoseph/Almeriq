# ALMERIQ — Engineering Workstreams

This document tracks all active engineering workstreams, their branches, scope,
assigned agents, dependencies, ownership, and status. It is the single source of
truth for workstream coordination. Update this file when workstream status
changes.

## Integration Baseline

| Branch | Base | Description | Status |
|--------|------|-------------|--------|
| `integration/platform-foundation` | `feat/marketplace-order-flow` | Shared foundation: migration fixes, shared infrastructure, contracts | active |

## Workstreams

### Agent 1 — Job Seeker Portal

| Field | Value |
|-------|-------|
| Branch | `feature/job-seeker-portal` |
| Base | `integration/platform-foundation` |
| Scope | Complete job seeker experience: profile setup, job discovery, applications |
| Tasks | - Review existing job domain models/services/repositories/routers (backend exists on baseline)<br>- Build job seeker profile setup UI (Basic Info, Skills, Education, Certifications, Work Experience, Projects, Matching Preference)<br>- Build job board with filters (role_type, search) and search bar<br>- Build job cards with apply modal (cover note)<br>- Build My Applications page with status pills and empty state<br>- Build JobSeekerDashboard (profile completion %, new matches, recent applications)<br>- Add frontend API client (`frontend/src/lib/api/job.js`) — currently MISSING<br>- Add routes: `/job-seeker/profile`, `/jobs`, `/my-applications` (ProtectedRoute)<br>- Add Job Seeker nav items to AppSidebar when `user.role === "job_seeker"`<br>- Wire DashboardPage.jsx role routing for `job_seeker` |
| Dependencies | Foundation: job domain backend (exists on baseline), job_seeker_profiles table (migration 002) |
| Files owned | `frontend/src/Pages/job-seeker/*`, `frontend/src/lib/api/job.js`, `frontend/src/App.jsx` (routes), `frontend/src/components/AppSidebar.jsx` (job_seeker nav), `frontend/src/Pages/shared/DashboardPage.jsx` (job_seeker dashboard) |
| Status | not started |
| Tests | Backend: none yet. Frontend: none yet. |
| Blockers | None |

---

### Agent 2 — Employer / Founder Recruitment

| Field | Value |
|-------|-------|
| Branch | `feature/employer-recruitment` |
| Base | `integration/platform-foundation` |
| Scope | Founder job posting and applicant management |
| Tasks | - Review existing founder job posting backend (job_posting model, job router)<br>- Build FounderJobPostingPage: create/edit job posting form + list existing postings<br>- Build FounderApplicantsPage: `/founder/jobs/:id/applicants` — list applications, status dropdown (PATCH)<br>- Build FounderPitchPage: startup pitch creation + Draft Investor Update email template<br>- Extend frontend API clients: `job.js` (founder job ops), `investor.js` (pitch ops)<br>- Add routes: `/founder/jobs`, `/founder/jobs/:id/applicants`, `/founder/pitch` (ProtectedRoute + FounderRoute)<br>- Fix `/founder/outreach` redirect → `/founder/pitch`<br>- Add founder sidebar nav: "Post a Job", "Investor Pitch"<br>- Add FounderWorkspaceOverview quick action cards: "Post a Job", "Pitch to Investors" |
| Dependencies | Foundation: job domain backend (exists on baseline) |
| Files owned | `frontend/src/Pages/founder/FounderJobPostingPage.jsx`, `FounderApplicantsPage.jsx`, `FounderPitchPage.jsx`, `frontend/src/lib/api/job.js` (extend), `frontend/src/lib/api/investor.js` (extend), `frontend/src/App.jsx`, `frontend/src/components/AppSidebar.jsx`, `frontend/src/Pages/shared/DashboardPage.jsx` |
| Status | not started |
| Tests | None yet. |
| Blockers | None |

---

### Agent 3 — Investor Portal

| Field | Value |
|-------|-------|
| Branch | `feature/investor-portal` |
| Base | `integration/platform-foundation` |
| Scope | Complete investor experience: profile, startup browsing, investment, portfolio |
| Tasks | - Review existing investor backend (investor_profile, startup_pitch, investment models)<br>- Build InvestorProfileSetupPage: 6 sections (Identity, Thesis, Track Record, Beyond Capital, Engagement, Compliance) with Save & Preview<br>- Build StartupBrowsePage: startup cards with stage filter, industry filter, mini traction chart (recharts), Invest Now 5-step PaymentFlow<br>- Build PortfolioPage: stats (total invested, equity offered, current value +8% ROI, ROI), 12-month performance chart, invested startup list<br>- Build InvestorDashboard: new deal flow count, deployed capital, portfolio companies, recent activity<br>- Frontend API client `frontend/src/lib/api/investor.js` exists — verify/extend<br>- Add routes: `/investor/profile`, `/investor/startups`, `/investor/portfolio` (ProtectedRoute)<br>- Add Investor nav in AppSidebar when `role === "investor"`<br>- Wire DashboardPage.jsx role routing for `investor` |
| Dependencies | Foundation: investor domain backend (exists on baseline) |
| Files owned | `frontend/src/Pages/investor/*`, `frontend/src/lib/api/investor.js` (extend), `frontend/src/App.jsx`, `frontend/src/components/AppSidebar.jsx`, `frontend/src/Pages/shared/DashboardPage.jsx` |
| Status | not started |
| Tests | None yet. |
| Blockers | None |

---

### Agent 4 — Founder Portal

| Field | Value |
|-------|-------|
| Branch | `feature/founder-portal` |
| Base | `integration/platform-foundation` |
| Scope | Stabilize and complete founder experience |
| Tasks | - Audit existing founder workflows (intake, analysis, validation, product, legal, ventures)<br>- Preserve existing venture creation, AI market analysis, feasibility, business planning, execution roadmap tools<br>- Review legal/company setup guidance and country-specific guides<br>- Complete startup fundraising/pitch creation and management (coordinate with Investor agent on shared pitch model)<br>- Add founder-facing investor connection requests<br>- Complete job creation and recruitment integration (coordinate with Employer agent)<br>- Improve error handling, loading states, empty states, frontend route protection<br>- Add tests |
| Dependencies | Foundation: founder domain backend (exists on baseline) |
| Files owned | `frontend/src/Pages/founder/*`, `frontend/src/lib/api/founder.js` (extend if needed), `frontend/src/components/AppSidebar.jsx` (founder nav), `frontend/src/Pages/shared/DashboardPage.jsx` |
| Status | not started |
| Tests | None yet. |
| Blockers | None |

---

### Agent 5 — Infrastructure Provider Portal

| Field | Value |
|-------|-------|
| Branch | `feature/provider-portal` |
| Base | `integration/platform-foundation` |
| Scope | Audit, stabilize, complete provider experience (DO NOT rebuild from scratch) |
| Tasks | - Inspect latest marketplace implementation and PR #4 (on feat/marketplace-order-flow)<br>- Preserve working marketplace functionality<br>- Audit provider onboarding and profile management<br>- Audit asset CRUD and media upload/deletion (Cloudinary)<br>- Audit provider coverage and engagement preferences<br>- Audit listing creation and discovery<br>- Audit checkout and order creation<br>- Audit provider order management and status transitions<br>- Audit dispatch, waybill uploads, and deal/signature flows<br>- Review messaging and notifications<br>- Identify missing workflows and genuine bugs<br>- Complete missing provider functionality without duplicating existing work<br>- Add regression tests<br>- Verify frontend/backend compatibility |
| Dependencies | Foundation: provider domain backend (fully implemented on baseline) |
| Files owned | `frontend/src/Pages/provider/*`, `frontend/src/lib/api/provider.js`, `frontend/src/lib/api/marketplace.js`, `frontend/src/lib/api/orders.js`, `frontend/src/lib/api/deals.js`, `frontend/src/lib/api/conversations.js`, `frontend/src/lib/api/notifications.js` |
| Status | not started |
| Tests | Backend: 32 tests pass. Frontend: provider page tests exist. |
| Blockers | None |

---

### Agent 6 — Expert Portal

| Field | Value |
|-------|-------|
| Branch | `feature/expert-portal` |
| Base | `integration/platform-foundation` |
| Scope | Replace placeholder with working expert experience |
| Tasks | - Define and implement expert profiles<br>- Support expertise categories, skills, experience, biography, location, availability, portfolio<br>- Implement expert onboarding and profile editing<br>- Implement expert discovery for founders<br>- Implement search and filtering<br>- Implement engagement/advisory requests<br>- Allow experts to accept or decline requests<br>- Track engagement status<br>- Integrate messaging and notifications<br>- Implement appropriate role authorization<br>- Add backend and frontend tests |
| Dependencies | Foundation: none (new domain) |
| Files owned | `frontend/src/Pages/expert/*`, `frontend/src/lib/api/expert.js` (new), `frontend/src/App.jsx` (routes), `frontend/src/components/AppSidebar.jsx` (expert nav), `frontend/src/Pages/shared/DashboardPage.jsx` (expert dashboard), `server/models/expert_profile.py` (new), `server/repositories/expert_profile.py` (new), `server/services/expert.py` (new), `server/schemas/expert.py` (new), `server/api/routers/expert.py` (new) |
| Status | not started |
| Tests | None yet. |
| Blockers | None |

---

## File Ownership Rules (Shared Infrastructure — Integration-Owned)

The following files/modules are integration-owned. Portal agents must NOT modify
them directly. If a portal agent discovers that shared infrastructure needs
modification, they must document the requirement in WORKSTREAMS.md and report it
to the integration lead.

| File/Module | Owner |
|-------------|-------|
| `server/core/db.py` | Integration |
| `server/api/dependencies.py` | Integration |
| `server/core/security.py` | Integration |
| `server/models/base.py` | Integration |
| `server/main.py` (router registration) | Integration |
| `frontend/src/lib/client.js` | Integration |
| `frontend/src/lib/api.js` (barrel) | Integration |
| `frontend/src/App.jsx` (route registration) | Integration |
| `frontend/src/components/AppSidebar.jsx` (shared nav structure) | Integration |
| `frontend/src/components/ProtectedRoute.jsx` | Integration |
| `frontend/src/components/ProviderRoute.jsx` | Integration |
| `frontend/src/components/FounderRoute.jsx` | Integration |
| `frontend/src/components/OnboardingWizard.jsx` | Integration |
| `frontend/src/context/AuthContext.jsx` | Integration |

## Migration Rules

- Every database schema change requires a new migration file.
- Never edit an already-applied migration to introduce a new schema change.
- Never generate conflicting migration heads independently.
- Use `op.create_table` with SQLAlchemy column definitions (dialect-compatible), not raw SQL with `AUTOINCREMENT`.
- Use `op.add_column` with `sa.Column` for additive changes.
- All migrations must be dialect-neutral: no native enums, no ARRAY, no raw dialect SQL.
- Verify `alembic upgrade head` and `alembic downgrade <base>` against both SQLite and PostgreSQL.

## Agent Execution Protocol

For every workstream:

1. Create or check out the assigned branch from `integration/platform-foundation`.
2. Inspect existing implementation before writing code.
3. Produce a short implementation plan.
4. Identify dependencies and shared-file conflicts.
5. Implement the assigned tasks.
6. Write or update tests.
7. Run relevant backend tests (`pytest -q`).
8. Run relevant frontend tests (`npm test -- --run`).
9. Run Python compilation and frontend production build (`npm run build`).
10. Run relevant lint checks.
11. Review the actual diff.
12. Commit logical changes with descriptive commit messages.
13. Push the branch.
14. Report completed work and verification evidence.

Each agent must report: what was implemented, files changed, API endpoints added/changed, models and migrations added, tests executed and actual results, build/lint results, known limitations, outstanding dependencies, commit SHA, branch name.

An agent must not claim a test passed unless it actually executed it and observed the result.

## Integration Order

1. Shared foundation (`integration/platform-foundation`) — DONE (branch created, migration 002 fixed)
2. Job Seeker + Employer Recruitment (shared job domain)
3. Founder + Investor workflows (shared pitch domain)
4. Expert portal
5. Infrastructure Provider stabilization
6. Cross-role messaging and notification integration
7. Full-platform acceptance testing

Keep `main` protected. Do not merge the integration branch into `main` until platform acceptance criteria are satisfied and explicit approval is received.
