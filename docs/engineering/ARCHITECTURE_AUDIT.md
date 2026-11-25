# Architecture audit and refactor

> Implementation references: [Documentation source map](../SOURCE_OF_TRUTH.md).

Audit baseline: source tree at `main` commit `2760de985ed2318fe9afd149c44b6ce8f50a8c2d`, including the architecture changes merged in [PR #18](https://github.com/creeksonJoseph/Almeriq/pull/18). The source paths below are the evidence for the implementation claims.

## Applied in this refactor

- **Founder legal workspace:** moved filing retrieval/submission, country guide retrieval, refresh, loading and error state into `useFounderLegalWorkspace`. The route component now owns navigation, local form presentation and template selection.
- **Provider onboarding:** moved profile/coverage/assets loading, draft persistence, asset upserts/deletions and completion orchestration into `useProviderSetupWorkflow`. The form remains in the page and React Hook Form owns field state/validation. The four independent initial reads now start in parallel, and stale responses are ignored after unmount.
- **Investor workspace:** moved profile/startup/portfolio reads, settings save, interest submission, portfolio confirmation persistence and conversation creation into `useInvestorWorkspace`. The route component retains display-only calculations and signature-canvas interaction.
- **Landing page:** extracted Hero, ecosystem, capabilities, waitlist form and footer into dedicated presentational sections. The route now composes those sections and handles only the hash-scroll entry behavior.
- **Error alerting:** fixed a Sentry filter defect that could classify an HTTP 5xx event as a client error solely because its exception type was `HTTPException`. The filter now suppresses only positively identified 4xx/validation events; regression tests cover 404, 422 and 5xx cases.
- **Shared architecture:** retains the Axios client/domain API modules and the user-scoped SWR cache from PR #18. Raw Axios/fetch usage remains confined to the shared client layer.

## Existing implementation confirmed during audit

- Backend is separated into routers, services, repositories, models, schemas and core configuration.
- GZip middleware is enabled.
- The standardized FastAPI error pipeline returns normalized client-safe 4xx/5xx payloads, logs 4xx as warnings, reports 5xx to Sentry, and filters expected 4xx events.
- ETag/304 support exists for expert discovery and founder venture reads; CORS exposes ETag.
- Model/migration indexes exist across core and domain tables; the advisory-request listing N+1 was removed with bulk repository lookups in PR #18.
- Frontend route-level lazy loading, skeleton states, hashed asset caching, vendor splitting, waitlist draft autosave, and lazy marketplace imagery are already present.
- The shared client cache provides TTL, request deduplication, ETag revalidation, cache subscriptions, mutation updates and private user-scoped keys.

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
