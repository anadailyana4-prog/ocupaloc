# Release Runbook

**Scope:** Pre-release checklists, release procedures, production deployment, and incident response.  
**Related:** See [RUNBOOK.md](RUNBOOK.md) for E2E test troubleshooting and CI/CD operational procedures.

## Scope
- Deployment target: Vercel production (main website)
- Optional runtime target: Cloudflare (OpenNext/Wrangler flows)

## Environment Variables

### Vercel (required)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (set to `https://ocupaloc.ro`)
- `REMINDERS_CRON_SECRET` (required for `/api/jobs/send-reminders`)

### Vercel (recommended observability)
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `ALERT_WEBHOOK_URL`
- `ALERT_WEBHOOK_BEARER_TOKEN` (optional)
- `ALERT_COOLDOWN_MS` (default `300000`)

## Sentry Integration Status

**Partial Active (Client/Server Init Only)**

Currently enabled:
- ✅ Client-side error initialization (`@sentry/nextjs` with DSN)
- ✅ Server-side error initialization (`src/sentry.server.config.ts`)
- ✅ PII redaction in event processing
- ✅ Tunnel route `/monitoring` (bypass ad-blockers)

Currently **NOT** enabled:
- ❌ Source map upload on build (SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN not set in CI)
- ❌ Release tracking and deploy markers
- ❌ Built-in Vercel cron monitoring (set to manual in next.config.ts)

To activate source map upload:
1. Set GitHub Secrets: `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
2. Update `.github/workflows/ci.yml` build step to pass these env vars
3. Build will automatically upload source maps to Sentry

Current behavior: App runs with error collection but manual release tracking. Full integration (with source maps) is pending final phase.

### Cloudflare (if used)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

## Stripe Integration Status

⏸️ **Postponed** — Stripe payment integration is NOT enabled in this phase.

- No Stripe secrets are required for current release.
- No Stripe flows are active (booking remains free).
- Stripe code and configuration are not activated.
- Re-enable for final phase: "Stripe final phase" (planned future milestone).

To activate Stripe later:
1. Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` in Vercel environment.
2. Uncomment/enable Stripe routes and checkout flows.
3. Update RELEASE_RUNBOOK.md with Stripe-specific pre-release steps.

## Pre-release Checklist
1. `pnpm install --frozen-lockfile`
2. `pnpm run test:ci`
3. `pnpm run typecheck`
4. `pnpm run lint`
5. `pnpm run build`
6. `pnpm run test:e2e` (smoke-uri env-gated)
7. `npx supabase db push`
8. `node --import tsx scripts/check-secrets.ts`
9. `node --import tsx scripts/verify-production-readiness.ts`
10. Confirm branch protection on `main` includes mandatory checks: `Typecheck, Lint & Build` and `Secret Scan (gitleaks)`
11. Confirm branch protection enforcement:
   - "Require status checks to pass before merging" is enabled
   - both checks are in required list: `Typecheck, Lint & Build`, `Secret Scan (gitleaks)`
   - "Require branches to be up to date before merging" is enabled

## Release Steps
1. Merge PR to `main` (branch protection requires CI green).
2. Verify GitHub Actions `CI` and `Security` workflows are successful.
3. Deploy production (`npx vercel --prod --yes`) if not auto-deployed.
4. Validate observability:
   - `GET /api/health` is `200` and `ok: true`
   - Sentry receives at least one test event (staging or controlled prod test)
   - alert webhook receives test payload from critical flow (`booking`/`cron`/`email`)
   - owner: on-call engineer
   - incident ack SLA: 15 minutes for P1/P2 outages
   - checkpoint: incident channel message with timestamp + screenshot/log link
5. Run smoke checks:
   - `GET /api/public/slots` returns 200 for valid query
   - booking from public page succeeds
   - reminders endpoint returns 401 without secret
   - signout endpoint returns 403 for invalid origin

## Incident Response

### Supabase degraded/down
1. Confirm incident via `/api/health` (`db: false`) and Supabase status page.
2. Pause cron execution externally (Vercel cron disable) to avoid noisy retries.
3. Announce degraded mode internally (booking write-path impact expected).
4. After recovery, run:
   - `GET /api/health`
   - one public slots check
   - one dashboard auth flow
5. If migration-related, rollback to last known good migration before re-enabling traffic.

### Resend degraded/down
1. Confirm failures via alert webhook (`flow=email`) and Resend status page.
2. Keep booking flow active (email failures are non-blocking), but post temporary user notice.
3. Reprocess failed reminders/notifications from logs for the outage window.
4. Remove temporary notice after confirmed recovery.

### Cron failures (`/api/jobs/send-reminders`)
1. Verify secret mismatch first (`401` cases).
2. Check app logs for `reminder_delivery_failed` events.
3. Run manual replay for a narrow window after fix.
4. Keep monitor on `GET /api/health` and webhook alerts for 24h.

## Rollback
1. Redeploy previous healthy Vercel deployment.
2. Re-run smoke checks.
3. Open incident note with root cause and follow-up tasks.

## Monthly Alerting Drill
1. Trigger one controlled `reportError` event in staging (`flow=booking`, `event=drill_alert`).
2. Verify webhook delivery and Sentry event receipt within 5 minutes.
3. Record evidence in release notes:
   - timestamp
   - links/screenshots for webhook + Sentry
   - operator name
4. Owner: on-call engineer.
5. SLA target: drill completed monthly and reviewed in ops sync.

## Backup Restore Drill
1. Weekly backup remains enabled in Supabase.
2. Practical restore drill cadence: monthly (non-production target project).
3. Drill command sequence (requires local Docker for Supabase CLI local stack):
   - `supabase link --project-ref <project_ref>`
   - `supabase db dump --linked --file backups/<date>.sql`
   - create throwaway project/environment
   - `supabase db reset --db-url <target_db_url>`
   - `psql <target_db_url> -f backups/<date>.sql`
4. Current status: restore drill attempted, blocked locally by missing Docker daemon. Repeat immediately after Docker is available.
5. Owner and checkpoint:
   - owner: tech lead / DBA rota
   - checkpoint: attach dump file name, target env, and restore validation query output in release notes

## GDPR Minimal Operational Baseline
1. Retention policy:
   - booking operational data: keep 24 months
   - notification logs/events: keep 12 months
   - rate limit records: keep 30 days
2. Export request process (data subject access):
   - verify requester identity
   - export records from `programari`, `programari_status_events`, `programari_reminders`, `profiles`
   - redact internal-only notes before delivery
   - target SLA: max 30 days
3. Deletion request process:
   - verify requester identity
   - delete/anonymize PII in booking and profile tables
   - preserve strictly required fiscal/legal records when applicable
   - store audit entry with request id, operator, timestamp
4. Run quarterly sample test for one export + one delete flow and record evidence.
5. Evidence template (for each quarterly test):
   - request id
   - request received timestamp
   - export completed timestamp
   - delete completed timestamp
   - operator

## Restore Drill Evidence (Mandatory)
For each monthly restore drill, record all fields below in release notes or incident log:

- operator name
- date and local timezone
- source project ref
- target non-production environment
- dump file name (example: `backups/2026-04-18.sql`)
- validation queries executed:
   - `select count(*) from billing_subscriptions;`
   - `select count(*) from billing_webhook_events;`
- result (`pass` / `fail`) and remediation notes

If Docker or local tooling blocks execution, do not mark drill as done. Record it as `blocked`, include blocker reason, and set a new owner/date.

## Legal Review Register (Mandatory)
Before production release, legal review is considered complete only with an explicit sign-off entry:

- reviewer name (jurist/lawyer)
- review date
- reviewed pages:
   - `/confidentialitate`
   - `/termeni`
   - `/cookies`
   - `/gdpr`
- status (`approved` / `changes_requested`)
- required edits and owner
- final approval timestamp

Without this register entry, mark legal review as pending.
