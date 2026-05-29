# Supabase migrations

**Source of truth:** `supabase/migrations/*.sql` (PostgreSQL), applied in numeric order `001` → `057`.

## Booking RPC chain (fresh install)

| Version | File | Purpose |
|---------|------|---------|
| 055 | `055_fix_booking_overlap_and_reactivated.sql` | Overlap buffer + `reactivated` status |
| 056 | `056_booking_billing_enabled_flag.sql` | `p_billing_enabled` gate |
| 057 | `057_align_booking_rpc_trial_days.sql` | Legacy trial = 14 days (matches app) |

Previously these shared version numbers with owner-portal migrations (`036_owner_portal`, `037_owner_portal_security_hardening`). They were renumbered to avoid `supabase db push` conflicts.

## Legacy

- `docs/archive/schema-d1-legacy.sql` — old Cloudflare D1/SQLite schema; **do not** use for Supabase.

## Apply to production

```bash
pnpm dlx supabase link --project-ref <ref>
pnpm dlx supabase db push --linked
```
