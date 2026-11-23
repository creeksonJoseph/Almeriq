# Architecture audit and refactor

Audit baseline: `.agents/skills/architectureskill.md`, repository tree and frontend/backend source on `main`, plus the previously merged architecture work in PR #18.

## Applied in this refactor

- **Founder legal workspace:** moved filing retrieval/submission, country guide retrieval, refresh, loading and error state into `useFounderLegalWorkspace`. The route component now owns navigation, local form presentation and template selection.
- **Provider onboarding:** moved profile/coverage/assets loading, draft persistence, asset upserts/deletions and completion orchestration into `useProviderSetupWorkflow`. The form remains in the page and React Hook Form owns field state/validation. The four independent initial reads now start in parallel, and stale responses are ignored after unmount.
- **Investor workspace:** moved profile/startup/portfolio reads, settings save, interest submission, portfolio confirmation persistence and conversation creation into `useInvestorWorkspace`. The route component retains display-only calculations and signature-canvas interaction.
- **Landing page:** extracted Hero, ecosystem, capabilities, waitlist form and footer into dedicated presentational sections. The route now composes those sections and handles only the hash-scroll entry behavior.
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

This is a source-level audit/refactor only. The repository connection permits source and Git operations but does not provide a runnable checkout or database/browser environment in this session. Frontend build/lint/tests, backend pytest, migration execution, PostgreSQL query plans and browser visual regression remain the final verification pass.
