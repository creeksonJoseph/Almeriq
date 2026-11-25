# Domain and Workflow Guide

> Implementation references: [Documentation source map](SOURCE_OF_TRUTH.md). Source paths for roles, workflows, models and pages are listed there.

> Implementation references: [Documentation source map](SOURCE_OF_TRUTH.md). Source paths for roles, workflows, models and pages are listed there.

This guide maps the current source tree to the user-facing product areas. For exact endpoint paths and schemas, use the live OpenAPI document described in [API Guide](API_GUIDE.md).

## 1. Roles

The application stores a role on the user record. Role normalization is important because legacy data and onboarding/admin flows may use different casing or separators. Backend normalization is in `server/core/roles.py`; frontend normalization is in `frontend/src/lib/roles.js`.

| Role | Main experience | Frontend entry points |
|---|---|---|
| Founder | Venture building, AI analysis, validation, legal workspace, team, jobs, fundraising, marketplace, expert discovery | `/dashboard`, `/founder/*`, `/marketplace`, `/founder/experts` |
| Infrastructure provider | Provider profile/setup, asset listings, order fulfillment, dispatch | `/provider/*` |
| Job seeker | Profile, job discovery, applications, team invitations | `/job-seeker/*` |
| Investor | Investor profile, startup discovery, deals, portfolio and updates | `/investor/*` |
| Expert | Expert profile and advisory dashboard/requests | `/dashboard`, `/expert/profile` |
| Admin | Waitlist administration | `/admin/waitlist` (backend admin guard still applies) |

The default `user` role may exist before onboarding or when no role has been selected. Do not assume the frontend role value is stored in one canonical casing without checking normalization.

## 2. Founder

Primary frontend pages are under `frontend/src/Pages/founder/`. Supporting hooks and components live in `frontend/src/hooks/` and `frontend/src/components/founder/`.

The founder area includes:
- Idea/intake and AI-assisted analysis.
- Venture listing and recovery.
- Validation workspace.
- Product planning and execution-oriented tools.
- Legal guides/templates/filings.
- Team/workforce and invitations.
- Job management and applicant review.
- Startup pitch/fundraising workflows.
- Marketplace and order-related founder screens.
- Expert discovery and advisory request creation.

AI behavior depends on Gemini configuration. Read `server/services/founder.py`, `server/services/founder_prompts.py`, and `server/core/gemini.py` before modifying prompts or response formats.

## 3. Infrastructure provider

Backend modules: provider, asset, coverage, order, deal. Frontend pages: `frontend/src/Pages/provider/`.

The provider journey includes account role selection, provider setup/profile, asset creation and editing, public listing preview, order review, status updates and dispatch/waybill workflows. Marketplace discovery is implemented separately and consumes provider listings.

Provider verification is a distinct domain concern: provider models/migrations include verification fields and the repository includes verification history/audit migrations. Do not conflate verification with whether an expert profile is publicly discoverable.

## 4. Marketplace and orders

Marketplace and search endpoints expose listings for browsing. Checkout creates the order/deal workflow; provider-side pages manage fulfillment. Read these modules together when changing order behavior:
- `server/api/routers/marketplace.py`, `order.py`, `deal.py`
- corresponding service/repository/schema/model files
- `frontend/src/Pages/marketplace/`, `Pages/checkout/`, `Pages/provider/`
- `frontend/src/lib/api/marketplace.js`, `orders.js`, `deals.js`

Check transaction boundaries and authorization on every transition. A UI status label does not establish that a backend transition is valid.

## 5. Job seeker and employer

The job seeker portal has dashboard, setup/profile, jobs and application detail screens. Employer job management is shared between founder and infrastructure-provider roles in the route configuration. Backend job authorization and ownership checks are in the job router/service layer.

Read:
- `server/api/routers/job.py`
- `server/services/job.py`
- job models, schemas and repositories
- `frontend/src/Pages/jobseeker/`
- `frontend/src/Pages/shared/EmployerJobsPage.jsx` and `EmployerJobApplicationsPage.jsx`
- `frontend/src/lib/api/job.js`

## 6. Investor and fundraising

Investor pages live under `frontend/src/Pages/investor/`; founder pitch/fundraising pages live under `frontend/src/Pages/founder/`. The backend has separate investor, startup-pitch and deal-related workflows. Review ownership and participant permissions carefully when changing pitches, investments, signing or portfolio visibility.

## 7. Expert and advisory

The expert portal is implemented, not merely a placeholder:
- Expert dashboard: `frontend/src/Pages/expert/ExpertDashboardPage.jsx`.
- Expert profile editor: `frontend/src/Pages/expert/ExpertProfilePage.jsx`, route `/expert/profile`.
- Founder discovery: `frontend/src/Pages/founder/ExpertDiscoveryPage.jsx`, route `/founder/experts`.
- Frontend hooks: `useExpertDashboard.js`, `useExpertProfile.js`, `useExpertDiscovery.js`.
- API client: `frontend/src/lib/api/expert.js`.
- Backend: expert router/service/repository/schema/model and advisory request model.

Current observed behavior: selecting Expert in the shared onboarding flow does not automatically run a dedicated expert-profile wizard. Experts can subsequently edit their profile. The profile fields are headline, bio, expertise (list of strings), years_experience, location, hourly_rate, availability, portfolio_url and is_active. The Pydantic update schema defaults is_active to true; the model also defaults it to true. Founder discovery lists active expert profiles and supports advisory requests. There is no separate expert profile approval/review queue in the inspected implementation; publication is based on the profile's active state. Re-check implementation before changing this product rule.

Important workflow:
1. User registers and completes shared identity/role onboarding.
2. User enters the role-aware dashboard.
3. Expert opens profile editor and completes profile details.
4. Active profile is available to founder discovery.
5. Founder submits an advisory request.
6. Expert reviews and updates the request status.
7. Accepted/completed requests can proceed into the messaging workflow where supported.

## 8. Messaging and notifications

Conversation and message routers provide authenticated inbox/message behavior. Notifications are a separate domain. These are shared capabilities used by multiple roles.

Before changing:
- Confirm that both participants are allowed to access the conversation.
- Confirm sender identity is derived from the authenticated user, not trusted from request body.
- Confirm unread/read state and notification side effects are consistent.
- Check frontend cache invalidation after sending messages or marking notifications read.

## 9. Admin and waitlist

Waitlist registration/confirmation and administrative waitlist management are separate from normal user onboarding. Admin access is backend-protected. Do not rely on a hidden frontend route as the only access control.


## 10. Persistent model inventory

The current model registry is server/models/__init__.py. It imports the following domain entities; use each model and its migration as the source of truth for exact columns and relationships.

| Domain | Registered models |
|---|---|
| Identity and waitlist | User, Waitlist |
| Founder | FounderVenture, FounderValidation, FounderLegalFiling, FounderAiCache, CompanyRegistrationGuide |
| Provider and marketplace | ProviderProfile, ProviderVerificationEvent, Asset, CoverageRegion, Order, OrderEvent, Deal |
| Collaboration | Conversation, Message, Notification |
| Investor and fundraising | InvestorProfile, StartupPitch, Investment, InvestorUpdate |
| Jobs and talent | JobPosting, JobApplication, JobSeekerProfile |
| Expert advisory | ExpertProfile, AdvisoryRequest |
| Team | TeamInvitation, TeamMembership |

When adding a model, import it in server/models/__init__.py so Alembic can discover its metadata. Inspect the migration chain before adding constraints, indexes or relationships.
