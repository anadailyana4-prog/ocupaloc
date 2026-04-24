# Post-deploy Verification Guide

> NOTE: This document targets the tenant/RBAC verification flow (`025`/`026`) and is not the billing source of truth.
> For current production billing validation and migration mapping (`017`/`018`, historically `023`/`024`), use [RELEASE_RUNBOOK.md](../RELEASE_RUNBOOK.md).

**Script:** `scripts/post-deploy-verify.ts`  
**Covers:** migrations `025_tenant_id_business_alignment.sql` + `026_rls_membership_rbac_alignment.sql`

---

## Prerequisites

The script uses the same `@supabase/supabase-js` dependency already installed in the project and runs with `tsx` (also already installed). No additional packages needed.

### Required env vars

| Variable | Source | Required for |
|----------|--------|-------------|
| `SUPABASE_URL` | Supabase project dashboard → Settings → API | SQL checks |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project dashboard → Settings → API → service_role key | SQL checks (bypasses RLS) |
| `VERIFY_BASE_URL` | Your production or staging URL | HTTP checks |
| `VERIFY_PUBLIC_SLUG` | A known active tenant slug (e.g. `salon-exemplu`) | HTTP checks (slug-specific) |

> **Security:** Never commit `SUPABASE_SERVICE_ROLE_KEY` to the repo. Pass it inline or via `.env.local` which is gitignored.

### Optional env vars

| Variable | Default | Effect |
|----------|---------|--------|
| `VERIFY_SKIP_HTTP` | `0` | Set to `1` to run SQL checks only |
| `VERIFY_SKIP_SQL` | `0` | Set to `1` to run HTTP checks only |
| `VERIFY_PHASE` | `all` | `025` runs only 025 checks; `026` runs only 026 checks; `all` runs both |
| `VERIFY_PUBLIC_SERVICE_ID` | _(unset)_ | If set to a service UUID, runs strict `/api/public/slots` check with `serviciuId`; if unset, that check is skipped |

---

## Run commands

### After applying migration 025 (before deploying app code)

```bash
cd /Users/balascanuanamaria/Proiecte/ocupaloc.ro

SUPABASE_URL=https://tffwoljimpdckvlogyqu.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
VERIFY_BASE_URL=https://www.ocupaloc.ro \
VERIFY_PUBLIC_SLUG=<your-slug> \
VERIFY_PHASE=025 \
tsx scripts/post-deploy-verify.ts
```

Expected output: all `[025]` checks green. `[026]` checks not run.

### After deploying app code + applying migration 026

```bash
SUPABASE_URL=https://tffwoljimpdckvlogyqu.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
VERIFY_BASE_URL=https://www.ocupaloc.ro \
VERIFY_PUBLIC_SLUG=<your-slug> \
VERIFY_PUBLIC_SERVICE_ID=<serviciu-uuid> \
VERIFY_PHASE=all \
tsx scripts/post-deploy-verify.ts
```

Expected output: all `[025]`, `[026]`, and `[http]` checks green.

### SQL checks only (no HTTP traffic to prod)

```bash
SUPABASE_URL=https://tffwoljimpdckvlogyqu.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
VERIFY_SKIP_HTTP=1 \
tsx scripts/post-deploy-verify.ts
```

### HTTP checks only (when you have the URL but not service key handy)

```bash
VERIFY_BASE_URL=https://www.ocupaloc.ro \
VERIFY_PUBLIC_SLUG=<your-slug> \
VERIFY_SKIP_SQL=1 \
tsx scripts/post-deploy-verify.ts
```

---

## What each check validates

### Phase 025 checks (SQL)

| Check | What it confirms |
|-------|-----------------|
| `tenant_id column on <table>` | Column was added by `ALTER TABLE ... ADD COLUMN tenant_id uuid` in 025 |
| `null tenant_id on <table>` | Backfill `UPDATE ... SET tenant_id = profesionist_id` completed with 0 NULLs |
| `FK servicii_tenant_id_fkey` etc. | Foreign key to `tenants(id)` is in place and valid |
| `sync constraint on <table>` | `*_tenant_profesionist_sync_chk CHECK (tenant_id = profesionist_id)` exists |

Tables checked: `servicii`, `programari`, `clienti_bocati`, `programari_reminders`, `programari_status_events`

### Phase 026 checks (SQL)

| Check | What it confirms |
|-------|-----------------|
| `has_tenant_role function` | `CREATE OR REPLACE FUNCTION public.has_tenant_role(...)` was applied |
| `policy <name> on <table>` | Each of the 12 new membership-first policies exists in `pg_policies` |
| `old owner-centric policies removed` | Old `*_owner` policies are absent (not silently coexisting) |
| `memberships_role_allowed_chk constraint` | Role domain `owner\|manager\|staff` is enforced at DB level |
| `memberships invalid role values` | 0 rows with roles outside the allowed domain |
| `no memberless tenants` | Every row in `tenants` has at least one row in `memberships` |

### HTTP checks

| Check | URL | Expected |
|-------|-----|----------|
| Login page alive | `GET /login` | 200 |
| Public profile page | `GET /s/<slug>` | 200 |
| Public slots API (strict, optional) | `GET /api/public/slots?slug=<slug>&serviciuId=<service_uuid>&date=<tomorrow>` | 200 with JSON `{ slots: string[] }` |
| Booking endpoint alive | `POST /api/book` (probe payload) | 400 (validation error, not 500) |
| Tenant dashboard (unauthenticated) | `GET /t/<slug>/dashboard` | 3xx (redirect to login) — **not** 500 |

If `VERIFY_PUBLIC_SERVICE_ID` is not set, the script logs a warning and skips the strict public slots check because the endpoint requires `serviciuId`.

How to obtain `VERIFY_PUBLIC_SERVICE_ID`:

```sql
select id, nume
from public.servicii
where tenant_id in (select id from public.tenants where slug = '<your-slug>')
	and activ = true
order by created_at desc
limit 5;
```

> The `POST /api/book` probe sends `{ "_probe": true }` which will fail validation but confirms the route is alive. A 500 would indicate a server-side crash (e.g. RLS blocking the route init, missing env var).

---

## Interpreting failures

| Failure message | Likely cause | Action |
|-----------------|-------------|--------|
| `column tenant_id missing — 025 not applied` | 025 hasn't run | Apply 025 first |
| `N rows with NULL — backfill incomplete` | UPDATE in 025 was interrupted | Re-run the UPDATE manually or re-apply 025 (idempotent) |
| `FK not found — migration 025 not complete` | FK step failed (orphan rows?) | Check precondition: `SELECT COUNT(*) FROM servicii WHERE profesionist_id NOT IN (SELECT id FROM tenants)` |
| `function not found — migration 026 not applied` | 026 hasn't run | Apply 026 |
| `policy not found — 026 not applied` | 026 ran partially | Re-apply 026 (idempotent DDL) |
| `still present: servicii.servicii_select_owner` | Old policy wasn't dropped | Run `DROP POLICY servicii_select_owner ON public.servicii;` manually |
| `tenants without membership: <slug>` | Bootstrap migration didn't create membership | `INSERT INTO memberships (tenant_id, user_id, role, onboarding_state) VALUES (...)` |
| `HTTP 500 for /api/book` | Route crashed — likely RLS, missing env var, or null tenant_id | Check Cloudflare Workers logs + Supabase API logs |
| `HTTP 500 for /s/<slug>` | Public view broken — `profesionisti_public` view RLS issue | Check 026 didn't accidentally drop the public select policy |

---

## Adding to package.json (optional)

```json
"verify:post-deploy": "tsx scripts/post-deploy-verify.ts",
"verify:post-deploy:025": "VERIFY_PHASE=025 tsx scripts/post-deploy-verify.ts",
"verify:post-deploy:026": "VERIFY_PHASE=all tsx scripts/post-deploy-verify.ts"
```
