-- Bucket public pentru logo-uri. Path recomandat: {auth.uid()}/logo.png

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Citire publică logos"
on storage.objects for select
using (bucket_id = 'logos');

create policy "Upload logo propriu"
on storage.objects for insert
with check (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);

create policy "Update logo propriu"
on storage.objects for update
using (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);

create policy "Ștergere logo propriu"
on storage.objects for delete
using (
  bucket_id = 'logos'
  and auth.uid() is not null
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);
