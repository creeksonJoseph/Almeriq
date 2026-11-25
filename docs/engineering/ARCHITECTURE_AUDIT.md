# Architecture audit and refactor

> Implementation references: [Documentation source map](../SOURCE_OF_TRUTH.md).

Audit baseline: source tree at `main` commit `2760de985ed2318fe9afd149c44b6ce8f50a8c2d`, including the architecture changes merged in [PR #18](https://github.com/creeksonJoseph/Almeriq/pull/18). The source paths below are the evidence for the implementation claims.

## Applied in this refactor

- **Founder legal workspace:** moved filing retrieval/submission, country guide retrieval, refresh, loading and error state into [`useFounderLegalWorkspace`](../../frontend/src/hooks/useFounderLegalWorkspace.js). [`FounderLegalPage`](../../frontend/src/Pages/founder/FounderLegalPage.jsx) retains navigation, local form presentation and template selection.
- **Provider onboarding:** moved profile/coverage/assets loading, draft persistence, asset upserts/deletions and completion orchestration into [`useProviderSetupWorkflow`](../../frontend/src/hooks/useProviderSetupWorkflow.js). [`ProviderSetupPage`](../../frontend/src/Pages/provider/ProviderSetupPage.jsx) keeps the form and React Hook Form owns field state/validation. The four initial reads (profile, coverage, physical assets, digital assets) start in parallel; stale responses are ignored after unmount.
- **Investor workspace:** moved profile/startup/portfolio reads, settings save, interest submission, portfolio confirmation persistence and conversation creation into [`useInvestorWorkspace`](../../frontend/src/hooks/useInvestorWorkspace.js). [`InvestorDashboardPage`](../../frontend/src/Pages/investor/InvestorDashboardPage.jsx) retains display calculations and signature-canvas interaction.
- **Landing page:** extracted Hero, ecosystem, capabilities, waitlist form and footer into [`LandingSections`](../../frontend/src/components/landing/LandingSections.jsx). [`LandingPage`](../../frontend/src/Pages/shared/LandingPage.jsx) composes those sections and handles the hash-scroll entry behavior.
- **Error alerting:** fixed a Sentry filter defect that could classify an HTTP 5xx event as a client error solely because its exception type was `HTTPException`. The filter in [`server/api/errors.py`](../../server/api/errors.py) suppresses only positively identified 4xx/validation events; regression tests are in [`test_error_pipeline.py`](../../server/tests/test_error_pipeline.py).
- **Shared architecture:** retains the Axios transport in [`client.js`](../../frontend/src/lib/client.js), domain API modules in [`frontend/src/lib/api/`](../../frontend/src/lib/api/), and user-scoped cache consumers such as [`useExpertDiscovery`](../../frontend/src/hooks/useExpertDiscovery.js) and [`useVentures`](../../frontend/src/hooks/useVentures.js) from PR #18. Direct Axios imports and browser `fetch()` calls are not used by route pages.

## Existing implementation confirmed during audit

- Backend is separated into [`routers`](../../server/api/routers/), [`services`](../../server/services/), [`repositories`](../../server/repositories/), [`models`](../../server/models/), [`schemas`](../../server/schemas/) and [`core`](../../server/core/) configuration.
- GZip middleware is registered in [`server/main.py`](../../server/main.py).
- The standardized FastAPI error pipeline is registered in [`server/main.py`](../../server/main.py) and implemented in [`server/api/errors.py`](../../server/api/errors.py): normalized client-safe 4xx/5xx payloads, 4xx warning logs, 5xx Sentry reporting and filtering of expected 4xx events.
- ETag/304 support is implemented for expert discovery and founder venture reads in [`expert.py`](../../server/api/routers/expert.py) and [`founder.py`](../../server/api/routers/founder.py); CORS exposes ETag in [`main.py`](../../server/main.py). Regression coverage is in [`test_http_cache.py`](../../server/tests/test_http_cache.py).
- Indexes and constraints are declared in the SQLAlchemy models and Alembic revisions; their production effectiveness is not established without query plans. The advisory-request listing N+1 was removed with bulk lookups in [`advisory_request.py`](../../server/repositories/advisory_request.py) as part of PR #18.
- Frontend route-level lazy loading is in [`App.jsx`](../../frontend/src/App.jsx); skeletons are used in route/page components; hashed asset caching is configured in [`vercel.json`](../../vercel.json); vendor splitting is in [`vite.config.js`](../../frontend/vite.config.js); waitlist draft autosave is in [`useWaitlist.js`](../../frontend/src/hooks/useWaitlist.js); marketplace listing images use lazy loading in [`MarketplacePage.jsx`](../../frontend/src/Pages/marketplace/MarketplacePage.jsx).
- The shared client cache in [`client.js`](../../frontend/src/lib/client.js) provides TTL, request deduplication, ETag revalidation, cache subscriptions and mutation updates; domain hooks supply user-scoped cache keys.

## Deliberately not added

- **Redis or another server cache:** the skill explicitly says not to add infrastructure without a measured need. The application already has client SWR and conditional GETs; no production cache-hit/latency evidence justified a new service.
- **A durable task queue:** no queue infrastructure exists. FastAPI background tasks are already used for current lightweight side effects. A durable queue should be introduced only when a critical job has retry/delivery requirements and a deployment owner.
- **Blanket cursor pagination:** current endpoints use capped limit/offset contracts and the UI does not uniformly implement infinite-scroll feeds. Changing all endpoint contracts without identifying truly deep feeds would add breaking complexity. Keyset pagination should be introduced for a specific high-volume feed using its actual sort key and a matching index.
- **Blanket `content-visibility` or virtualization:** most current screens use bounded result sets; applying containment/virtualization without measured long-list rendering pressure risks focus, scroll and layout regressions.
- **Database index changes based only on model inspection:** indexes exist across the domain models and migrations, but the final index plan must be driven by production-like `EXPLAIN ANALYZE` plans and representative row counts. No such database/query-plan access was available during this pass.
- **ETags on every GET:** conditional responses are applied to suitable stable list reads; personalized or mutation-sensitive endpoints need endpoint-specific cache policy and invalidation review before broad rollout.

## Verification boundary

The hook-level regression tests are present at:
- `frontend/src/hooks/useFounderLegalWorkspace.test.jsx`
- `frontend/src/hooks/useInvestorWorkspace.test.jsx`
- `frontend/src/Pages/provider/ProviderSetupPage.test.jsx`

The Sentry filter regression cases are in `server/tests/test_error_pipeline.py` (HTTP 404, validation 422, HTTP 5xx and an exception-instance 503 case).

These tests were subsequently executed by GitHub Actions run [#50](https://github.com/creeksonJoseph/Almeriq/actions/runs/45610595905) on PR #41 head `a05abd65e83f8a6c55e63f645917ac461a8ec12d`. The Backend tests job and Frontend checks job both completed successfully; the frontend job ran ESLint, Vitest and the production build. This is CI evidence for that commit, not a claim of local execution.

Still not established by that CI run: browser-level visual/E2E behavior, live integrations, production migration execution, PostgreSQL query plans, production row counts, or real deployment health. Those require the relevant runtime, database and provider access.
