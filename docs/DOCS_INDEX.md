# Docs Index

Single index for all project documentation.

## Quick Start

- `docs/00_START_HERE_60_SEC.md`
- `docs/PROJECT_OPERATING_GUIDE.md`
- `docs/A_TO_Z_MASTER_INDEX.md`
- `docs/FEATURE_IMPLEMENTATION_CHECKLIST.md`
- `docs/ENGINEERING_STANDARDS.md` — production-safe change rules
- `docs/DISTRIBUTION.md` — no secrets in ZIP exports
- `supabase/MIGRATIONS.md` — DB migration order (incl. `055`–`057`)

## Architecture

- `docs/adr/001-atomic-booking-rpc.md` — why booking uses PostgreSQL RPC

## Release and Operations

- `RELEASE_RUNBOOK.md`
- `RUNBOOK.md`
- `DEPLOY_CHECKLIST.md`
- `docs/post-deploy-verify.md`

## Audit and Strategy

- `docs/technical-audit-2026-05-11.md`
- `docs/romania-growth-playbook.md`

## Project Evaluation (2026-05-18)

- `docs/evaluation-signup-to-first-booking.md` — flux signup → prima programare + gap-uri metrici
- `docs/evaluation-cron-jobs-env-map.md` — cron Vercel, secrete, env per job
- `docs/evaluation-uncommitted-pr-split.md` — review WIP local și propunere 8 PR-uri

## Platform Production (Supabase → Vercel → GSC)

- `docs/platform-production-handoff.md` — checklist unic închidere producție

## Rules

- Any new operational document must be added here.
- If two docs overlap, keep one as source of truth and link to it.