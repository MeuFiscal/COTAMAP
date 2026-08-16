begin;

drop policy if exists "business_logos_insert_owner" on storage.objects;
create policy "business_logos_insert_owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'business-logos'
  and private.is_owner(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "business_logos_update_owner" on storage.objects;
create policy "business_logos_update_owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'business-logos'
  and private.is_owner(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'business-logos'
  and private.is_owner(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "business_logos_delete_owner" on storage.objects;
create policy "business_logos_delete_owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'business-logos'
  and private.is_owner(((storage.foldername(name))[1])::uuid)
);

commit;
