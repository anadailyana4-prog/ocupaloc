# Release Runbook

**Scope:** Pre-release checklists, release procedures, production deployment, and incident response.  
**Related:** See [RUNBOOK.md](RUNBOOK.md) for E2E test troubleshooting and CI/CD operational procedures.

## Scope
- Deployment target: Vercel production (main website)
- Optional runtime target: Cloudflare (OpenNext/Wrangler flows)

## GitHub -> Vercel Auto-Deploy Contract

- Source of truth for live production is GitHub `main` deployed to Vercel.
- `vercel.json` must not disable GitHub deployment integration for production.
- Vercel Project must track repository `anadailyana4-prog/ocupaloc` with Production Branch set to `main`.
- If production is stale while `main` has new commits, first suspect project integration/branch mapping/alias state in Vercel dashboard.

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
2. Ensure CI build step exposes these env vars to Next build
3. Build will automatically upload source maps via `withSentryConfig` in `next.config.ts`

Current behavior: app captures errors with Sentry; source-map upload depends on CI secrets presence.

### Cloudflare (if used)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

## Migration Numbering Note (Audit Mapping)

Migration numbering was normalized in-repo. Historical references still found in older notes map as follows:
- historical `023` -> current `017_profesionisti_whatsapp_public.sql`
- historical `024` -> current `018_billing_subscriptions.sql`

When validating production state, treat current numbering (`017`, `018`) as source of truth.

## Stripe Integration Status

✅ **Active** — Stripe subscription billing is enabled.

Required billing env vars:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `BILLING_ENABLED=true`

Billing routes in use:
- `POST /api/billing/create-checkout`
- `POST /api/billing/portal`
- `POST /api/webhooks/stripe`

Safety guards currently enforced:
- Duplicate checkout guard for `active`/`trialing` subscriptions
- Webhook fallback resolution by `stripe_customer_id` if metadata is missing
- Entitlement deny states handled explicitly (`incomplete`, `paused`, `canceled`, `past_due` outside grace)

## SLO & Error Budget Policy

Production release gate is controlled by `/api/ops/slo` and `/api/jobs/release-guard`.

SLO indicators (window default: 60 min):
- Booking success rate:
  - good: >= 99%
  - warn: >= 97%
  - critical: < 97%
- Login success rate:
  - good: >= 99%
  - warn: >= 97%
  - critical: < 97%
- API availability (non-5xx on critical probes):
  - good: >= 99.9%
  - warn: >= 99%
  - critical: < 99%
- p95 latency (critical probes):
  - good: <= 800ms
  - warn: <= 1500ms
  - critical: > 1500ms

Release decision:
- Any `critical` SLO => release gate `NO-GO`
- Otherwise => `GO`

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
10. `node --import tsx scripts/verify-billing-readiness.ts`
11. `pnpm run ops:synthetic`
12. `pnpm run ops:slo`
13. Confirm branch protection on `main` includes mandatory checks: `Typecheck, Lint & Build` and `Secret Scan (gitleaks)`
14. Confirm branch protection enforcement:
   - "Require status checks to pass before merging" is enabled
   - both checks are in required list: `Typecheck, Lint & Build`, `Secret Scan (gitleaks)`
   - "Require branches to be up to date before merging" is enabled

## Billing Validation Checklist (Production)
1. Checkout flow:
   - trigger `POST /api/billing/create-checkout` as an authenticated owner
   - expect redirect to Stripe Checkout (303)
2. Duplicate checkout guard:
   - for an account with `active` or `trialing` subscription, re-trigger checkout
   - expect redirect to billing portal or dashboard info message (no second checkout)
3. Webhook ingestion:
   - send Stripe test events for `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_failed`
   - expect `200 { received: true }` from `/api/webhooks/stripe`
4. Subscription row persistence:
   - verify `public.subscriptions` has/updates row with `profesionist_id`, `stripe_customer_id`, `status`, `current_period_end`
5. Entitlement behavior:
   - `active`/`trialing` => booking allowed
   - `incomplete`/`paused`/`canceled` => booking denied with Romanian user-safe message
   - `past_due` within grace => allowed; outside grace => denied with Romanian user-safe message
6. Cancel flow:
   - cancel from Stripe portal
   - verify webhook updates status and dashboard banner reflects new state
7. Past-due grace behavior:
   - force `past_due` in Stripe test mode
   - verify booking remains allowed only through grace window, then denied

## Cron Schedule Visibility (Source: vercel.json)
- `/api/jobs/send-reminders` -> `0 8 * * *`
- `/api/jobs/synthetic-monitor` -> `0 9 * * *`
- `/api/jobs/release-guard` -> `0 10 * * *`

Reminder cron authorization:
- endpoint accepts `Authorization: Bearer <REMINDERS_CRON_SECRET>`
- rotate `REMINDERS_CRON_SECRET` and update scheduler in lockstep

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

## Automated Synthetic Monitoring

The `synthetic-monitor.yml` GitHub Actions workflow runs every 6 hours and checks:

| Check | Endpoint | Fail condition |
|---|---|---|
| App health | `GET /api/health` | HTTP ≠ 200 or `db: false` |
| Public booking page | `GET /ana-nails` | HTTP ≠ 200 |
| Slug redirect | `GET /s/ana-nails` | HTTP ≠ 200 |
| Booking API | `POST /api/book` (empty body) | HTTP 5xx |
| Auth guard | `GET /dashboard` | No redirect to /login |

Failures trigger a `critical` alert to `ALERT_WEBHOOK_URL` (if configured). Monitor runs:
- https://github.com/anadailyana4-prog/ocupaloc/actions/workflows/synthetic-monitor.yml


## Recovery Targets
- RTO target (major incident): 30 minutes
- RPO target (booking data): 15 minutes

## Incident Response

### 15-minute Incident Checklist (P1/P2)
1. Acknowledge incident in ops channel and assign incident commander.
2. Run health triage:
   - `curl -s https://ocupaloc.ro/api/health | python3 -m json.tool`
   - `curl -s -H "Authorization: Bearer <secret>" https://ocupaloc.ro/api/ops/slo?windowMinutes=60 | python3 -m json.tool`
3. Trigger synthetic validation:
   - `curl -s -H "Authorization: Bearer <secret>" https://ocupaloc.ro/api/jobs/synthetic-monitor | python3 -m json.tool`
4. If gate is NO-GO, run rollback command set.
5. Post incident update with ETA and next checkpoint.

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

### Fast Rollback — Vercel (< 2 min)
```bash
# 1. List last N deployments
npx vercel ls --prod

# 2. Instant alias rollback — replace <previous-deployment-url> with the URL from step 1
npx vercel alias set <previous-deployment-url> ocupaloc.ro

# 3. Verify production is on the old deployment
curl -s https://ocupaloc.ro/api/health | python3 -m json.tool
```

### Full Branch Rollback — Git (< 5 min)
```bash
# Find the last known-good SHA (e.g. from CI run that was green)
git log --oneline -10

# Revert the bad commit (creates a new revert commit — preferred for main with branch protection)
git revert <bad-sha> --no-edit
git push origin main

# OR: Hard reset to previous SHA (requires force-push — only if branch protection allows)
# git reset --hard <good-sha>
# git push --force-with-lease origin main
```

### Database Rollback — Migration (< 10 min)
```bash
# Check active migrations
npx supabase migration list --linked

# Roll back last migration
npx supabase db reset --linked   # full reset to migration history (DESTRUCTIVE — dev only)

# Preferred for production: apply a corrective migration
npx supabase migration new rollback_<description>
# edit file, then:
npx supabase db push --linked
```

### Smoke Check After Rollback
```bash
curl -sf https://ocupaloc.ro/api/health && echo "✅ health ok"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://ocupaloc.ro/ana-nails)
echo "Public page: HTTP $HTTP"
```


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
4. Validate restore with practical queries:
   - `select count(*) from public.programari;`
   - `select count(*) from public.programari_status_events;`
   - `select count(*) from public.operational_events;`
5. Success criteria:
   - restore completes under RTO target (30 min)
   - max acceptable data loss within RPO target (15 min)
6. Current status: restore drill attempted, blocked locally by missing Docker daemon. Repeat immediately after Docker is available.
7. Owner and checkpoint:
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
