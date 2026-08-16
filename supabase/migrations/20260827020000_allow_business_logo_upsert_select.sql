begin;

drop policy if exists "business_logos_select_owner" on storage.objects;
create policy "business_logos_select_owner"
on storage.objects for select to authenticated
using (
  bucket_id = 'business-logos'
  and private.is_owner(((storage.foldername(name))[1])::uuid)
);

commit;
