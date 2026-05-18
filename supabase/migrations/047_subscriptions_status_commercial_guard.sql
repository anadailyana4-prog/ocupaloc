-- Guardrail for commercial status values used by billing flows.
-- NOT VALID avoids breaking existing rows while enforcing future writes.
alter table public.subscriptions
  drop constraint if exists subscriptions_status_allowed;

alter table public.subscriptions
  add constraint subscriptions_status_allowed
  check (
    status in (
      'trial',
      'trialing',
      'trialing_stripe',
      'active',
      'past_due',
      'canceled',
      'reactivated',
      'incomplete',
      'paused',
      'unpaid',
      'incomplete_expired'
    )
  ) not valid;