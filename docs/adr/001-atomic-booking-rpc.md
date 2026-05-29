# ADR 001: Atomic booking via PostgreSQL RPC

**Status:** Accepted  
**Date:** 2026-04 (migrations 023–029, hardened 055–057)

## Context

Public booking must prevent double-booking under concurrent clients. Application-level check-then-insert races when two requests select the same slot.

## Decision

Use a single PostgreSQL function `book_appointment_atomic` (`SECURITY DEFINER`) that:

1. Locks `profesionisti` and `servicii` rows (`FOR UPDATE`).
2. Evaluates entitlement (when `p_billing_enabled = true`), client block list, smart rules, and slot overlap using `data_final` (buffers included).
3. Inserts `programari` in the same transaction.

The Next.js app calls the RPC via `insertProgramareForProfSlug` with `p_billing_enabled: isBillingEnabled()`.

## Consequences

**Positive**

- No race on slot availability for the same professional.
- Business rules enforced consistently for all clients (anon/authenticated).

**Negative**

- Logic split between TS (`slots.ts` grid) and SQL (must stay aligned on `data_final`).
- Migration changes require careful ordering (`055`–`057`); duplicate version numbers caused CLI friction (resolved by renumbering).

## Alternatives considered

- Serializable transactions in app code — harder to guarantee under Supabase connection pooling.
- Optimistic locking on `programari` — still allows failed UX under load.

## References

- `supabase/migrations/055_fix_booking_overlap_and_reactivated.sql`
- `supabase/migrations/056_booking_billing_enabled_flag.sql`
- `supabase/migrations/057_align_booking_rpc_trial_days.sql`
- `src/lib/booking/insert-programare.ts`
