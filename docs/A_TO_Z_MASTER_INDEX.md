# OcupaLoc A-Z Master Index

Purpose: keep the project clean, clear, and easy to change without confusion.

Fast path:
- `docs/00_START_HERE_60_SEC.md`
- `docs/DOCS_INDEX.md`

## How to use this file

1. Start with "A-Z Systems" to find the exact area you want to change.
2. Use "A-Z Commands" to run the right command in the right moment.
3. Use "A-Z Environment Variables" to configure safely.
4. Follow "Clean Change Flow" before merge/deploy.
5. For any new work item, use `docs/FEATURE_IMPLEMENTATION_CHECKLIST.md`.

## A-Z Systems

### A - API
- Location: `src/app/api`
- Use for: endpoints, webhook handlers, cron routes, health and ops routes.

### B - Billing
- Location: `src/app/api/billing`, `src/app/api/webhooks/stripe`, `src/lib/billing`
- Use for: checkout, portal, subscription entitlement logic.

### C - Components
- Location: `src/components`
- Use for: UI building blocks and feature views.

### D - Database (Supabase)
- Location: `supabase/migrations`
- Use for: schema changes, RLS-related SQL, view policies.

### E - Email
- Location: `src/lib/email`
- Use for: booking notifications, reminders, delivery logic.

### F - Frontend Pages
- Location: `src/app`
- Use for: route pages, SEO landing pages, legal pages.

### G - Growth Scripts
- Location: `scripts/send-leads-campaign.ts`
- Use for: outbound dry-run/send workflows.

### H - Health and Observability
- Location: `src/lib/observability.ts`, `src/lib/ops-events.ts`, `src/app/api/health`
- Use for: runtime health, operational events, incident signals.

### I - Integrations
- Location: `src/lib/supabase`, `src/lib/email`, `src/app/api/webhooks`
- Use for: Supabase, Resend, Stripe integration points.

### J - Jobs (Cron/Automation)
- Location: `src/lib/jobs`, `src/app/api/jobs`, `.github/workflows`
- Use for: reminder jobs, release guards, synthetic monitors.

### K - Knowledge Docs
- Location: `docs`, `README.md`, `RUNBOOK.md`, `RELEASE_RUNBOOK.md`, `DEPLOY_CHECKLIST.md`
- Use for: operational and developer documentation.

### L - Landing Experience
- Location: `src/components/landing`, `src/app/page.tsx`
- Use for: homepage narrative, CTA flow, trust sections.

### M - Middleware
- Location: `middleware.ts`
- Use for: request boundary logic and route guards.

### N - Notifications
- Location: `src/lib/email`, `src/lib/jobs`
- Use for: client/professional confirmation and reminder pipelines.

### O - Operations
- Location: `scripts/check-slo-release-gate.ts`, `scripts/run-synthetic-monitor.ts`
- Use for: pre-release checks and production confidence.

### P - Policies and Guards
- Location: `src/lib/rate-limit.ts`, `src/lib/slo-policy.ts`, `src/lib/cron-auth.ts`
- Use for: traffic guardrails, SLO gates, cron authorization.

### Q - Quality Gates
- Location: `package.json` scripts + `.github/workflows/ci.yml`
- Use for: lint/test/typecheck/coverage/build standards.

### R - Repositories Layer
- Location: `src/lib/repositories`
- Use for: DB access abstraction and query boundaries.

### S - Security and Secrets
- Location: `scripts/check-secrets.ts`, `.env.example`
- Use for: secret hygiene, history leak detection, env discipline.

### T - Tests
- Location: `tests`
- Use for: API, auth, booking, billing, SLO, and integration tests.

### U - UI primitives
- Location: `src/components/ui`
- Use for: reusable visual primitives and interaction atoms.

### V - Validation
- Location: `src/lib/validators`, `src/lib/slug.ts`, `src/lib/phone.ts`
- Use for: payload validation and user input normalization.

### W - Workflows (CI/CD)
- Location: `.github/workflows`
- Use for: CI checks, backups, synthetic monitor automations.

### X - eXecution order (docs)
- Read order:
  1. `README.md`
  2. `docs/PROJECT_OPERATING_GUIDE.md`
  3. `docs/A_TO_Z_MASTER_INDEX.md`
  4. `RELEASE_RUNBOOK.md`
  5. `RUNBOOK.md`
  6. `DEPLOY_CHECKLIST.md`

### Y - Why this structure
- Goal: any change request maps to exactly one primary owner area.

### Z - Zero confusion rule
- If you cannot place a change into one letter above, update this index first.

## A-Z Commands

### C
- `pnpm run check:all` -> full local gate including build and audit.
- `pnpm run check:full` -> local gate + E2E.
- `pnpm run check:local` -> lint + tests + typecheck.

### D
- `pnpm run deploy` -> Cloudflare deployment flow.
- `pnpm run deploy:pages` -> Cloudflare pages deployment flow.
- `pnpm run deploy:safe` -> secret/db verify + deploy flow.

### L
- `pnpm run leads:dry -- <csvPath>` -> dry-run lead campaign.
- `pnpm run leads:send -- <csvPath>` -> send campaign.
- `pnpm run lint` -> ESLint checks.

### O
- `pnpm run ops:slo` -> SLO release gate check.
- `pnpm run ops:synthetic` -> synthetic monitor check.

### P
- `pnpm run preview` -> local Cloudflare-style preview.

### T
- `pnpm run test` -> test suite.
- `pnpm run test:ci` -> CI-like test suite.
- `pnpm run test:coverage` -> coverage report.
- `pnpm run test:coverage:check` -> enforce coverage thresholds.
- `pnpm run test:e2e` -> E2E suite.
- `pnpm run typecheck` -> TypeScript checks.

### V
- `pnpm run verify:billing` -> billing readiness.
- `pnpm run verify:db` -> production DB readiness.
- `pnpm run verify:secrets` -> secret hygiene checks.

## A-Z Environment Variables

### A
- `ALERT_COOLDOWN_MS` -> throttle alert cadence.
- `ALERT_WEBHOOK_BEARER_TOKEN` -> auth for alert receiver.
- `ALERT_WEBHOOK_URL` -> alert destination endpoint.

### B
- `BILLING_ENABLED` -> enable/disable billing enforcement.
- `BOOKING_CONFIRMATION_SECRET` -> booking confirmation signing secret.

### C
- `CRM_SYNC_WEBHOOK_BEARER_TOKEN` -> auth for CRM sync target.
- `CRM_SYNC_WEBHOOK_URL` -> CRM sync target endpoint.

### D
- `DEMO_EMAIL` -> demo login email.
- `DEMO_PASSWORD` -> demo login password.

### G
- `GROWTH_NUDGE_BEARER_TOKEN` -> auth for growth webhook.
- `GROWTH_NUDGE_WEBHOOK_URL` -> growth webhook endpoint.

### N
- `NEXT_PUBLIC_CLARITY_PROJECT_ID` -> clarity analytics.
- `NEXT_PUBLIC_CONTACT_EMAIL` -> public contact email.
- `NEXT_PUBLIC_GA_ID` -> Google Analytics ID.
- `NEXT_PUBLIC_SENTRY_DSN` -> browser-side Sentry DSN.
- `NEXT_PUBLIC_SITE_URL` -> canonical public site URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> public Supabase key.
- `NEXT_PUBLIC_SUPABASE_URL` -> public Supabase URL.

### P
- `PLAYWRIGHT_BASE_URL` -> E2E target URL.
- `PLAYWRIGHT_BOOKING_SLUG` -> test booking slug.
- `PLAYWRIGHT_ENABLE_DEMO_SMOKE` -> enable/disable demo smoke test.

### R
- `RATE_LIMITS_CRON_SECRET` -> auth secret for rate-limit cron.
- `REMINDERS_CRON_SECRET` -> auth secret for reminders cron.
- `RESEND_API_KEY` -> email provider key.
- `RESEND_FROM` -> sender address.

### S
- `SENTRY_AUTH_TOKEN` -> source-map upload auth.
- `SENTRY_DSN` -> server-side Sentry DSN.
- `SENTRY_ORG` -> Sentry org.
- `SENTRY_PROJECT` -> Sentry project.
- `STRIPE_PRICE_ID` -> Stripe plan price.
- `STRIPE_PUBLISHABLE_KEY` -> Stripe publishable key.
- `STRIPE_SECRET_KEY` -> Stripe secret key.
- `STRIPE_WEBHOOK_SECRET` -> Stripe webhook verification secret.
- `SUPABASE_SERVICE_ROLE_KEY` -> privileged server-side Supabase key.

## Clean Change Flow (No Confusion)

1. Pick the A-Z system owner area above.
2. Implement only in that area first.
3. Add/adjust tests in `tests`.
4. Run `pnpm run check:local`.
5. If production-impacting, run:
   - `pnpm run verify:secrets`
   - `pnpm run verify:db`
   - `pnpm run verify:billing`
   - `pnpm run ops:synthetic`
   - `pnpm run ops:slo`
6. Update docs links when behavior/process changed.

## Definition of Clean and Clear

- No ambiguous owner area for a change.
- No secret value in tracked files.
- No merge with failing quality gates.
- No deploy without readiness checks.
- No undocumented operational behavior.