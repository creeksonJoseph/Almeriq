# Known Gaps and Handover Checklist

> This is a source-review checklist, not a claim that every item is a confirmed defect. Items marked "verify" require a maintainer with runtime/dashboard access.

## 1. Documentation debt identified

- The original root `README.md` describes Almeriq primarily as an infrastructure-provider portal and lists only a small subset of endpoints. That is no longer a complete product description.
- The original root `ARCHITECTURE.md` describes a founder AI analysis design, not the whole platform architecture.
- `docs/PLAN.md` contains an early provider-portal implementation plan and missing-feature statements that conflict with the current repository.
- The old multi-agent workstream and platform-contract guides contained stale role, model, route and branch status statements. They have been removed rather than kept as onboarding material.
- Any test counts copied from older documentation are historical; do not repeat them as current results without running the test suite.

The root README and ARCHITECTURE entry points have been refreshed. The old provider-focused plan remains labelled as historical. The obsolete agent coordination guides have been removed. The architecture audit is retained only as optional historical engineering context.

## 2. Runtime verification not performed in this documentation pass

The GitHub source connection permits repository inspection and Git writes, but not execution of the application in a real local checkout. Therefore the following remain unverified here:
- Backend pytest suite result on the current `dev` head.
- Frontend Vitest, ESLint and production build on the current `dev` head.
- Clean database migration from zero to head and upgrade from a production-like prior revision.
- Full PostgreSQL/Neon compatibility and transaction behavior.
- End-to-end browser workflows across every role.
- Upload, email, OAuth, Gemini, Redis and Sentry integrations against live credentials.
- Production Render/Vercel configuration, deploy health, DNS, backups and database restore procedure.

CI status should be checked for the exact documentation commit before calling this handover complete.

## 3. Configuration findings and remaining checks

The source-level issues previously identified in local configuration have been corrected on this branch:

- **Docker Compose auth configuration:** Compose now supplies `JWT_SECRET_KEY`, the setting read by `server/core/config.py`. The unused `ENVIRONMENT` variable has been removed. The Compose secret remains a local-only placeholder and must not be reused in a shared or hosted environment.
- **Docker Compose database persistence:** the backend SQLite database now lives at `/data/almeriq_dev.db` on a named volume. Running `docker compose down -v` intentionally deletes that local database.
- **Node runtime alignment:** GitHub Actions and the frontend Docker image now use Node 22. The container uses `npm ci` to install from the lockfile.

The following still require access to deployment dashboards or a live environment and cannot be confirmed from repository source alone:

- **Render auth configuration:** `render.yaml` does not declare `JWT_SECRET_KEY` or `COOKIE_SECURE`. Confirm a strong unique JWT secret is explicitly configured in the Render service and that `COOKIE_SECURE=true` for HTTPS production. Also verify Gemini, Google OAuth, Upstash and Sentry values if those integrations are enabled.
- **Frontend deployment configuration:** root `vercel.json` builds from the repository root and enables automatic deployment for `main` while disabling it for `dev` and `feat-*`. `frontend/vercel.json` is an alternative for a Vercel project rooted at `frontend/`. Confirm which configuration and project root the live Vercel project uses.
- **Production database and operations:** verify the actual Render branch, PostgreSQL attachment, custom domains, backups, restore procedure, deployment health and environment values in the relevant dashboards.

These changes are source-reviewed but have not been executed in a local Docker environment during this pass. CI must be checked for the exact pull-request head before the changes are considered verified.


## 4. Product/engineering questions for the incoming maintainer

- Confirm whether the current onboarding flow should direct experts immediately to `/expert/profile` after role selection. Today the shared onboarding and separate expert profile editor are distinct.
- Confirm the product policy for expert profile publication. The inspected implementation exposes active profiles; no separate expert approval workflow was found.
- Confirm whether profile activation is user-controlled or should be moderated. Do not add a review queue without a product decision.
- Confirm production source of truth for role values and any legacy role strings; keep backend/frontend normalization aligned.
- Confirm whether the provider verification review workflow is actively operated and who owns approvals.
- Confirm actual payment/escrow behavior. The UI terminology must not be interpreted as real payment processing unless the provider integration and settlement flow are implemented and verified.
- Confirm whether Redis is required in production or only optional. In-memory fallbacks behave differently across multiple instances.
- Confirm the supported Node runtime and pin it consistently in CI/deployment docs.
- Confirm ownership/access for Render, Vercel, Neon, Cloudinary, Resend, Google OAuth, Upstash and Sentry.

## 5. Security review checklist

- [ ] Replace example/default JWT secret in every deployed environment and confirm the live Render value is explicitly configured.
- [ ] Confirm production COOKIE_SECURE=true and correct SameSite/domain settings for the deployed frontend/API topology.
- [ ] Verify production cookie flags, cookie domain/path and HTTPS.
- [ ] Verify CORS allowlist is exact and does not use wildcard with credentials in production.
- [ ] Confirm password reset and OAuth callback flows cannot be abused.
- [ ] Confirm every private router enforces authentication and role.
- [ ] Confirm every object-level read/write enforces ownership.
- [ ] Confirm uploads validate content type, size and ownership.
- [ ] Confirm secrets never appear in frontend `VITE_*` variables.
- [ ] Confirm logs and Sentry events do not include tokens, passwords or unnecessary personal data.
- [ ] Review admin access provisioning and waitlist actions.
- [ ] Review rate limits and abuse controls on auth, waitlist, AI and upload endpoints.

## 6. Data and operations checklist

- [ ] Identify production database owner and obtain least-privilege access.
- [ ] Confirm backup schedule, retention and tested restore process.
- [ ] Record current Alembic revision and ensure it matches repository head.
- [ ] Confirm migration execution ownership and deployment concurrency behavior.
- [ ] Verify data retention/deletion expectations.
- [ ] Verify external service quotas, billing and renewal ownership.
- [ ] Document incident contacts and escalation process.
- [ ] Verify production health checks and alert routing.

## 7. Incoming developer first-week plan

1. Obtain repository and hosting access; do not use the outgoing developer's personal credentials.
2. Read the handover docs and inspect `dev`/ `main` divergence.
3. Run backend and frontend locally against a disposable database.
4. Capture current CI baseline and fix any environment/setup discrepancies in docs.
5. Generate OpenAPI and reconcile endpoint docs with actual route definitions.
6. Run smoke tests for registration, role onboarding, one core journey per role, messaging and notifications.
7. Validate database migrations and backup/restore process.
8. Verify live integrations and deployment environment without exposing secrets.
9. Prioritize security and reliability gaps before adding new features.
10. Agree on product roadmap and release process with the project owner.

## 8. Completion criteria for this handover

- [ ] README points to current docs.
- [ ] Setup instructions are repeatable on a clean machine.
- [ ] Architecture and domain maps match the current source.
- [ ] Environment variables are documented without real secret values.
- [ ] API reference points to OpenAPI and identifies all router domains.
- [ ] Existing stale docs are labelled or updated.
- [ ] CI is green for the documentation branch.
- [ ] Project owner confirms production access transfer and operational ownership.
