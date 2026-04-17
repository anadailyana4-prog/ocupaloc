-- RLS pentru tabele interne: programari_reminders și programari_status_events
-- Aceste tabele sunt write/read exclusiv prin service role (job-uri server-side).
-- Niciun client autentificat sau anonim nu accesează direct aceste tabele.

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'programari_reminders') then
    alter table public.programari_reminders enable row level security;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'programari_status_events') then
    alter table public.programari_status_events enable row level security;
  end if;
end $$;

-- Politici restrictive: doar service_role poate citi/scrie
-- (service_role bypassează RLS by default în Supabase, dar politicile explicite
-- documentează intenția și blochează orice acces accidental prin anon/authenticated)

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'programari_reminders') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'programari_reminders'
        and policyname = 'programari_reminders_service_only'
    ) then
      execute $policy$
        create policy programari_reminders_service_only
          on public.programari_reminders
          as restrictive
          for all
          to authenticated, anon
          using (false)
          with check (false)
      $policy$;
    end if;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'programari_status_events') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'programari_status_events'
        and policyname = 'programari_status_events_service_only'
    ) then
      execute $policy$
        create policy programari_status_events_service_only
          on public.programari_status_events
          as restrictive
          for all
          to authenticated, anon
          using (false)
          with check (false)
      $policy$;
    end if;
  end if;
end $$;
