create table if not exists public.api_rate_limits (
  key text primary key,
  count int not null default 0,
  reset_at timestamptz not null
);

create index if not exists api_rate_limits_reset_at_idx
  on public.api_rate_limits (reset_at);

alter table public.api_rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key text,
  p_max_requests int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_now timestamptz := now();
begin
  if p_key is null or btrim(p_key) = '' then
    return false;
  end if;

  if p_max_requests <= 0 or p_window_seconds <= 0 then
    return false;
  end if;

  insert into public.api_rate_limits (key, count, reset_at)
  values (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  on conflict (key)
  do update
    set count = case
      when public.api_rate_limits.reset_at <= v_now then 1
      else public.api_rate_limits.count + 1
    end,
    reset_at = case
      when public.api_rate_limits.reset_at <= v_now then v_now + make_interval(secs => p_window_seconds)
      else public.api_rate_limits.reset_at
    end
  returning count into v_count;

  return v_count <= p_max_requests;
end;
$$;

revoke all on function public.check_rate_limit(text, int, int) from public;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
