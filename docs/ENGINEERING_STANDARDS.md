# Engineering standards (OcupaLoc)

Operational rules for changes to this codebase. **Production booking and billing flows must not break.**

## Non-negotiables

1. **Migrations `001`–`053` are immutable history** — never edit; add `054+` only.
2. **Backward compatible** — schema, API responses, RPC signatures (use new params with defaults).
3. **Reproduce → test → fix → verify** — `pnpm run check:local` before merge to `main`.
4. **Secrets** — only `.env.example` in git; run `pnpm run prepare:distribution` before ZIP exports.
5. **No Friday production deploys** without on-call coverage.

## Database

- Source of truth: `supabase/migrations/` (PostgreSQL).
- Naming: `NNN_short_description.sql` (unique `NNN`).
- Booking RPC chain: see `supabase/MIGRATIONS.md` (`055`–`057`).
- Apply: `pnpm dlx supabase db push --linked` (staging first, then production).
- Legacy D1 schema: `docs/archive/schema-d1-legacy.sql` — do not use.

## Testing

| Command | Purpose |
|---------|---------|
| `pnpm run check:local` | lint + unit (node) + vitest + typecheck |
| `pnpm run build` | production build |
| `pnpm run test:e2e` | Playwright (needs app + env) |
| `pnpm run verify:db` | production DB readiness (`.env.local`) |

Critical paths: `src/lib/booking/`, `src/app/api/book/`, `src/lib/billing/`, auth middleware.

## Code quality

- TypeScript strict; explicit return types on public APIs.
- Prefer extraction over deletion; components ≤ ~300 lines when touching them.
- Zod on API inputs; rate limits on public routes.
- Comments explain **why**, not **what**.

## Deploy safety

1. Staging Supabase + Vercel preview with same migrations.
2. Feature flags for risky product changes (`BILLING_ENABLED`, etc.).
3. Monitor Sentry + Vercel logs 24h after deploy.
4. Rollback: revert Vercel deployment; DB rollbacks only via forward migrations.

## Documentation

| Doc | When to update |
|-----|----------------|
| `CHANGELOG.md` | User-facing or operational changes |
| `README.md` | Setup / ports / env |
| `docs/adr/*.md` | Architectural decisions |
| `supabase/MIGRATIONS.md` | New migration numbering |

## Priority order

1. User-facing bugs (booking, payments, auth)
2. Performance (API latency, bundle size via code-split)
3. Developer experience (errors, scripts, docs)
4. Clarity refactors (only with tests)
5. Debt — only if blocking features

## Avoid

- Aesthetic refactors without tests
- Big-bang rewrites
- Dependency bumps without security/compat reason
- Removing features without impact analysis
