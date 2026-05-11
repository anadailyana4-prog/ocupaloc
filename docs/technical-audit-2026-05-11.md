# OcupaLoc Technical Audit - 2026-05-11

## Scope
- CI/CD reliability
- Secret hygiene
- Runtime monitoring and release gates
- Production platform consistency (Vercel, Supabase, Resend, Cloudflare)

## Implemented Now

### 1) DB backup workflow hardening
File: `.github/workflows/db-backup.yml`

Changes:
- Fixed shell/Python parsing issue that caused scheduled backup runs to fail.
- Replaced fragile heredoc usage with inline Python invocation.
- Added URL-safe credential encoding when rewriting pooler URL to direct DB host.

Expected outcome:
- `DB Backup` scheduled runs should stop failing with `unexpected EOF` / exit code 2.

### 2) Synthetic monitor workflow consistency
File: `.github/workflows/synthetic-monitor.yml`

Changes:
- Replaced hardcoded `https://ocupaloc.ro` references with `${TARGET_URL}` for:
  - `/api/health`
  - landing page check
  - `/api/book`
  - `/dashboard` redirect check

Expected outcome:
- Workflow is reusable and deterministic for both scheduled and manual `workflow_dispatch` targets.

### 3) CI messaging clarity
File: `.github/workflows/ci.yml`

Changes:
- Renamed coverage step from `70% minimum` to `thresholds`.

Reason:
- Actual enforced thresholds in `package.json` are 55/60/55/55.
- Prevents confusion during triage of failed CI runs.

### 4) Secrets audit script quality
File: `scripts/check-secrets.ts`

Changes:
- Switched from scanning key names to scanning secret-like values.
- Restricted scan to tracked files via `git ls-files` (avoids noise from cache directories).
- Improved history scan to detect suspicious token-like values.

Current result:
- Working tree scan: clean.
- Git history scan: still reports critical leak risk.

## Verified Platform State
- Vercel production deployment is `Ready` and `Current`.
- Supabase advisor reports no active issues.
- Resend domain is verified.
- Cloudflare DNS required records are configured.
- Production health endpoint responds OK.

## Remaining Critical Item

### Rotate compromised high-privilege keys (mandatory)
Reason:
- Git history scan flags potential historical secret exposure.

Minimum rotation set:
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (if any leak is confirmed)

Execution order:
1. Rotate key in provider dashboard.
2. Update Vercel Production env var immediately.
3. Redeploy production.
4. Re-run health checks and synthetic checks.
5. Invalidate old key and verify old key no longer works.

## Definition of Done (Technical)
- [ ] DB Backup run succeeds at least once after patch.
- [ ] CI main run is green after latest commit.
- [ ] Git history secret scan is resolved (rotated and confirmed).
- [ ] Synthetic monitor + SLO gate pass on latest production deploy.
- [ ] Post-deploy verification checklist passes end-to-end.
