-- Normalize legacy subscription statuses to the canonical commercial set,
-- then validate the existing guard constraint.

update public.subscriptions
set status = case
  when status is null or btrim(status) = '' then 'canceled'
  when lower(btrim(status)) = 'cancelled' then 'canceled'
  when lower(btrim(status)) in ('stripe_trialing', 'trialingstripe', 'trialing-stripe', 'trial_stripe') then 'trialing_stripe'
  when lower(btrim(status)) in ('incomplete expired', 'incomplete-expired') then 'incomplete_expired'
  else lower(btrim(status))
end
where status is null
   or btrim(status) = ''
   or status <> lower(btrim(status))
   or lower(btrim(status)) in ('cancelled', 'stripe_trialing', 'trialingstripe', 'trialing-stripe', 'trial_stripe', 'incomplete expired', 'incomplete-expired');

update public.subscriptions
set status = 'canceled'
where status not in (
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
);

alter table public.subscriptions
  validate constraint subscriptions_status_allowed;
