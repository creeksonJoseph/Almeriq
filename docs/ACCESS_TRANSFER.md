# Production Access and Ownership Transfer

> Implementation references and authority boundaries: [Documentation source map](SOURCE_OF_TRUTH.md). Dashboard and account-state items below require confirmation by the relevant owner.

> Implementation references and authority boundaries: [Documentation source map](SOURCE_OF_TRUTH.md). Dashboard and account-state items below require confirmation by the relevant owner.

## Purpose

This checklist is for transferring Almeriq operations from the outgoing developer to the next maintainer. It is not a place to record passwords, API keys, recovery codes or private tokens. Transfer access through each provider's own invitation/role-management system.

The repository cannot prove who owns the live provider accounts or which environment variables are currently set. Every item below must be confirmed with the project owner/account administrator.

## 1. Repository and source control

- [ ] Confirm the GitHub organization/account that should own the repository.
- [ ] Confirm at least two trusted maintainers have admin-level recovery access.
- [ ] Confirm the incoming developer has least-privilege access needed for branches, PRs, Actions and releases.
- [ ] Confirm branch protection/rulesets for `main` and `dev`, required reviews and required status checks.
- [ ] Confirm who may approve production promotion and who may merge to `main`.
- [ ] Transfer issue/PR ownership and active roadmap context.
- [ ] Remove the outgoing developer's access only after the new maintainer confirms access works.
- [ ] Never share personal GitHub credentials or personal access tokens.

## 2. Render (backend)

- [ ] Identify the production Render workspace and service for Almeriq.
- [ ] Add the incoming maintainer to the workspace with the minimum role required.
- [ ] Confirm the backend service name, region, plan, Docker build context, health check and deploy branch.
- [ ] Confirm the connected repository and auto-deploy behavior.
- [ ] Confirm the current production deploy commit and last successful deploy.
- [ ] Confirm custom domains, TLS and health status.
- [ ] Review environment variable names in the dashboard without copying secret values into GitHub or this document.
- [ ] Confirm a strong unique `JWT_SECRET_KEY` is explicitly set; the code default is not safe for production.
- [ ] Confirm `COOKIE_SECURE=true` and correct cookie/CORS settings for the actual domain topology.
- [ ] Confirm `DATABASE_URL`, Resend and Cloudinary values are present and current.
- [ ] Confirm optional Gemini, Google OAuth, Upstash and Sentry settings where those features are enabled.
- [ ] Confirm billing owner, payment method and renewal alerts.
- [ ] Confirm who can restart, redeploy, roll back and inspect logs.

## 3. Database provider (PostgreSQL / Neon)

- [ ] Identify the actual production database provider, workspace, project, branch/instance and region.
- [ ] Invite the incoming maintainer; do not transfer a personal database password.
- [ ] Confirm production and non-production databases are clearly distinguished.
- [ ] Confirm the Render service uses the intended production connection string.
- [ ] Confirm connection pooling, SSL and network restrictions.
- [ ] Record current Alembic revision from a controlled read-only/admin session.
- [ ] Confirm automated backups/PITR are enabled and retention is understood.
- [ ] Identify the person authorized to restore or branch the database.
- [ ] Perform a restore drill to an isolated non-production target and verify core tables/workflows.
- [ ] Confirm billing, quota and renewal owner.
- [ ] Do not export production user data to personal devices.

See [Database Guide](DATABASE_GUIDE.md) for schema, migration and restore precautions.

## 4. Vercel (frontend)

- [ ] Identify the production Vercel team/project.
- [ ] Invite the incoming maintainer with the required role.
- [ ] Confirm whether the project uses root `vercel.json` or `frontend/vercel.json`.
- [ ] Confirm project root, build command, output directory and production branch.
- [ ] Confirm production and preview environment values, especially `VITE_API_BASE_URL`.
- [ ] Confirm custom domains, DNS, TLS and redirects.
- [ ] Confirm current production deployment commit and last successful deployment.
- [ ] Confirm rollback procedure and billing owner.

Remember: all `VITE_*` values are exposed to the browser bundle. Never store secrets there.

## 5. External integrations

| Service | What to transfer/verify | Notes |
|---|---|---|
| Resend | Team access, sending domain, verified sender, API key ownership, billing | Email delivery depends on domain verification and account status. |
| Cloudinary | Account/team access, cloud name, API key/secret ownership, storage/transform quotas | Used for asset/listing media. |
| Google Cloud / OAuth | OAuth project, authorized origins/redirect URIs, client IDs and secret ownership | Client ID may be public; client secret is server-only. |
| Google Gemini | Project/account access, API key, quota and billing | Used by founder AI workflows. |
| Upstash | Redis database, URL/token ownership, limits and billing | Backend has an in-memory fallback; multi-instance behavior differs. |
| Sentry | Organization/project access, DSN, alert routing and retention | Confirm sensitive values are not sent in events. |
| Domain/DNS registrar | Domain owner, renewal, DNS records, MFA/recovery and billing | Confirm registrar access independently of Vercel/Render. |

## 6. Security and identity

- [ ] Enable MFA on all provider accounts.
- [ ] Ensure at least two organization-controlled account admins exist where supported.
- [ ] Store recovery codes in the organization's approved password manager, not GitHub.
- [ ] Rotate secrets if they were shared informally, stored on a departing developer's machine or exposed in chat/logs.
- [ ] Review deploy keys, GitHub Actions secrets, webhook secrets and personal access tokens.
- [ ] Review admin users in Almeriq and remove obsolete privileged access through the approved process.
- [ ] Verify password reset email sender and Google OAuth ownership.
- [ ] Confirm who receives security alerts and production incident notifications.

## 7. Operational knowledge transfer

The outgoing and incoming maintainers should walk through:
1. How to deploy backend and frontend independently.
2. How to inspect CI and identify a failed check.
3. How migrations run before deployment and at backend startup.
4. How to verify database backup status and execute a restore drill.
5. How to inspect Render logs, Vercel deployment logs and Sentry events.
6. How to rotate a credential without downtime where possible.
7. How to disable a broken integration safely.
8. How to roll back an application deployment and when a database forward-fix is required.
9. How to handle an account compromise, data exposure or production outage.

## 8. Sign-off

Record completion in the project owner's approved handover tracker, not by pasting credentials here.

- Outgoing maintainer: ____________________
- Incoming maintainer: ____________________
- Project owner/account owner: ____________________
- Date of access verification: ____________________
- Date of backup restore drill: ____________________
- Open access/operational blockers: ____________________
