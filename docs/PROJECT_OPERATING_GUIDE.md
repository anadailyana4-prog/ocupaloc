# OcupaLoc Project Operating Guide

This is the single navigation file for day-to-day work in this repository.

Ultra-fast entry:
- `docs/00_START_HERE_60_SEC.md`
- `docs/DOCS_INDEX.md`

## 1) Start Here (Daily)

1. Sync repo and install:

```bash
pnpm install
```

2. Run app locally:

```bash
pnpm run dev
```

3. Run the safe local quality gate before commit:

```bash
pnpm run check:local
```

## 2) One-Line Command Map

### Core development
- `pnpm run dev` -> start local app
- `pnpm run check:local` -> lint + tests + typecheck
- `pnpm run check:all` -> full CI-like local gate

### Production readiness
- `pnpm run verify:secrets` -> secret hygiene scan (tracked files + git history patterns)
- `pnpm run verify:db` -> Supabase readiness checks
- `pnpm run verify:billing` -> billing readiness checks

### Operations and release safety
- `pnpm run ops:synthetic` -> synthetic checks
- `pnpm run ops:slo` -> release SLO gate

### Outreach tooling
- `pnpm run leads:dry -- <csvPath>` -> inspect campaign candidates without sending
- `pnpm run leads:send -- <csvPath>` -> send campaign after manual review

## 3) Where To Change What

### Routing and pages
- Main App Router pages: `src/app`
- Public booking path variants and SEO pages: `src/app/**`

### Business/UI components
- Shared UI and feature components: `src/components`
- Landing content: `src/components/landing`
- Booking card flow: `src/components/booking`

### Business logic and integrations
- Domain logic/helpers: `src/lib`
- Supabase helpers and repositories: `src/lib/supabase`, `src/lib/repositories`
- Email/observability/ops jobs: `src/lib/email`, `src/lib/jobs`, `src/lib/ops-events.ts`

### API handlers
- API routes: `src/app/api`

### Data model
- SQL migrations: `supabase/migrations`

### Operational automation
- CI/CD workflows: `.github/workflows`
- Local ops scripts: `scripts`

## 4) Safe Change Checklist (Any New Feature/Fix)

1. Implement in smallest vertical slice.
2. Add/update tests in `tests`.
3. Run:

```bash
pnpm run check:local
```

4. If touching production behavior, also run:

```bash
pnpm run verify:secrets
pnpm run verify:db
pnpm run verify:billing
pnpm run ops:synthetic
pnpm run ops:slo
```

5. Update docs if operational behavior changed:
- `README.md` for developer entry points
- `RELEASE_RUNBOOK.md` for production/release behavior
- `RUNBOOK.md` for incident and CI troubleshooting

## 5) Documentation Order (Use This Sequence)

1. `docs/00_START_HERE_60_SEC.md` -> 5-step quick flow
2. `docs/DOCS_INDEX.md` -> full docs map
3. `README.md` -> local setup and overview
4. `docs/PROJECT_OPERATING_GUIDE.md` -> execution map
5. `docs/A_TO_Z_MASTER_INDEX.md` -> alphabetized system/command/env map
6. `docs/FEATURE_IMPLEMENTATION_CHECKLIST.md` -> standard feature workflow
7. `RELEASE_RUNBOOK.md` -> release and production checks
8. `RUNBOOK.md` -> E2E and incident handling
9. `DEPLOY_CHECKLIST.md` -> Vercel production alignment
10. `docs/technical-audit-2026-05-11.md` -> latest hardening status

## 6) Guardrails That Prevent Broken Flow

- Treat Vercel production as source of truth for live `ocupaloc.ro`.
- Keep secrets only in environment variables, never in tracked files.
- Do not merge if `pnpm run check:local` fails.
- Prefer explicit env-backed config (no hidden defaults for critical secrets).
- Keep workflow URLs/config reusable (parameterized) rather than hardcoded.