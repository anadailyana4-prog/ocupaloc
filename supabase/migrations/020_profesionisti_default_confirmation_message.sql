begin;

alter table public.profesionisti
  alter column mesaj_dupa_programare
  set default 'Te aștept! Primești locația după confirmare.';

commit;
