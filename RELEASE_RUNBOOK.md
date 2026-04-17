# Release Runbook

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

### Cloudflare (if used)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM`

## Pre-release Checklist
1. `pnpm install --frozen-lockfile`
2. `pnpm run test:ci`
3. `pnpm run typecheck`
4. `pnpm run lint`
5. `pnpm run build`
6. `npx supabase db push`
7. `node --import tsx scripts/check-secrets.ts`
8. `node --import tsx scripts/verify-production-readiness.ts`

## Release Steps
1. Merge PR to `main` (branch protection requires CI green).
2. Verify GitHub Actions `CI` and `Security` workflows are successful.
3. Deploy production (`npx vercel --prod --yes`) if not auto-deployed.
4. Run smoke checks:
   - `GET /api/public/slots` returns 200 for valid query
   - booking from public page succeeds
   - reminders endpoint returns 401 without secret
   - signout endpoint returns 403 for invalid origin

## Rollback
1. Redeploy previous healthy Vercel deployment.
2. Re-run smoke checks.
3. Open incident note with root cause and follow-up tasks.
