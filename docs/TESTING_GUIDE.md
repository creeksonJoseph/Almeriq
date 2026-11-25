# Testing and Release Verification Guide

## 1. What CI runs

Workflow: `.github/workflows/ci.yml`.

Triggers:
- Push to `dev`.
- Pull request targeting `dev`.
- Manual workflow dispatch.

Jobs:
1. Backend: Python 3.13, `uv sync --locked`, then `PYTHONPATH=. uv run --no-sync pytest -q` from `server/`.
2. Frontend: Node 22, `npm ci`, `npm run lint`, `npm test -- --reporter=dot`, and `npm run build` from `frontend/`.

CI currently does not deploy production. A green CI run proves only that these defined checks passed for that commit; it does not prove live provider integrations, production migrations, browser end-to-end behavior or deployment health.

## 2. Local commands

Backend, from `server/`:

~~~bash
uv sync --locked
PYTHONPATH=. uv run pytest -q
~~~

Run a focused backend file:

~~~bash
PYTHONPATH=. uv run pytest -q tests/test_expert_advisory.py
~~~

Frontend, from `frontend/`:

~~~bash
npm ci
npm test
npm run lint
npm run build
~~~

Run a focused frontend test:

~~~bash
npm test -- src/hooks/useInvestorWorkspace.test.jsx
~~~

The npm `test` script already runs `vitest run`. The `--reporter=dot` argument is used by CI for compact output.

## 3. Backend test coverage map

The current `server/tests/` suite includes the following named coverage areas. This is an inventory of test intent based on test names and source inspection, not a coverage percentage.

| Test file | Main scenarios represented |
|---|---|
| `test_auth.py` | Registration, duplicate email, password auth, Google OAuth client validation, onboarding completion |
| `test_role_authorization.py` | Role normalization, founder/provider/job-owner dependencies, admin flag separation |
| `test_asset_lifecycle.py` | Provider asset idempotency, client IDs, ownership, deletion, DB uniqueness, concurrent insert |
| `test_marketplace_checkout.py` | Order + deal creation atomicity, rollback, provider order state changes, HTTP checkout |
| `test_order_deal_flow.py` | Order events, deal signing, state transitions, waybills, ownership, notifications |
| `test_deal_participant_access.py` | Buyer authorization including buyers who also have provider profiles |
| `test_provider_verification.py` | Admin verification changes, audit history and revocation |
| `test_expert_advisory.py` | Advisory creation, validation, expert ownership and request state transitions |
| `test_job_posting_ownership.py` | Founder/provider job ownership and application review permissions |
| `test_team_membership.py` | Invitation validation, acceptance/decline, membership creation/removal |
| `test_startup_pitch_publication.py` | Draft visibility, completeness requirements and publication behavior |
| `test_investor_reported_portfolio.py` | Reported portfolio state is not represented as settled money |
| `test_investor_updates.py` | Update visibility, investor relationship and founder ownership |
| `test_notification_workflows.py` | Notification preferences, supported types, pagination and unread summary |
| `test_http_cache.py` | ETag response and 304 behavior |
| `test_error_pipeline.py` | Sentry event filtering for HTTP and validation errors |
| `test_smoke.py` | Import smoke test |

## 4. Frontend tests

Vitest runs in jsdom and discovers `src/**/*.test.{js,jsx,ts,tsx}`; setup is in `frontend/src/setupTests.js`.

Known test files include:
- `frontend/src/hooks/useFounderLegalWorkspace.test.jsx`
- `frontend/src/hooks/useInvestorWorkspace.test.jsx`
- `frontend/src/lib/api/client.test.js`

Use the repository search/test output to discover all current frontend test files rather than assuming this list is exhaustive.

## 5. Important coverage gaps to consider

The existence of domain endpoints/pages does not mean every user journey is covered by automated tests. Review and add tests for:
- Full registration -> OTP -> login -> onboarding -> role-specific profile completion.
- Expert profile create/update/deactivate and public discovery visibility.
- Investor profile updates and full pitch -> investor interest -> deal confirmation lifecycle.
- Provider profile, asset media upload and listing publication across role boundaries.
- Messaging/conversation creation from advisory and investment requests, read state and notification consistency.
- Upload failure, invalid MIME type, size limits, storage outage and ownership checks.
- Real PostgreSQL migrations and constraints; most unit/integration fixtures may use SQLite.
- Timeouts, retries, rate limits and upstream API failures for Gemini, Resend, Cloudinary, Google OAuth, Redis and Sentry.
- Browser-level tests for route guards, responsive layouts, cookie behavior and critical multi-role journeys.
- Multi-instance behavior when Redis is absent and the backend uses in-memory fallback state.

Do not claim these are absent without checking new tests added after this guide was last reviewed.

## 6. Test design expectations

For each new backend workflow, cover:
1. Happy path.
2. Missing/invalid input.
3. Unauthenticated request.
4. Authenticated user with wrong role.
5. Cross-user or cross-tenant resource access.
6. Invalid state transition.
7. Duplicate request/idempotency where applicable.
8. Database constraint behavior and rollback.
9. Notification/event side effects.
10. External service failure behavior.

For frontend hooks/pages, cover:
- Loading, empty, success and error states.
- API payload shape and error display.
- Disabled/submitting state and duplicate submissions.
- Cache invalidation after mutation.
- Role-aware visibility and navigation.
- Keyboard/accessibility basics for interactive controls.

## 7. Before a release

- [ ] Check the exact PR head SHA and latest GitHub Actions run.
- [ ] Confirm backend and frontend jobs both completed successfully.
- [ ] Review any skipped, flaky or newly failing tests.
- [ ] Confirm migration head and production-like migration result.
- [ ] Run critical end-to-end workflows in staging.
- [ ] Verify external integrations using non-production credentials where possible.
- [ ] Check Sentry/logs for new errors after deployment.
- [ ] Obtain explicit release approval before promoting to `main`.
