begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "business_logos_insert_owner" on storage.objects;
create policy "business_logos_insert_owner"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role = 'owner'::public.user_role
      and membership.is_active
      and membership.deleted_at is null
  )
);

drop policy if exists "business_logos_update_owner" on storage.objects;
create policy "business_logos_update_owner"
on storage.objects for update to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role = 'owner'::public.user_role
      and membership.is_active
      and membership.deleted_at is null
  )
)
with check (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role = 'owner'::public.user_role
      and membership.is_active
      and membership.deleted_at is null
  )
);

drop policy if exists "business_logos_delete_owner" on storage.objects;
create policy "business_logos_delete_owner"
on storage.objects for delete to authenticated
using (
  bucket_id = 'business-logos'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role = 'owner'::public.user_role
      and membership.is_active
      and membership.deleted_at is null
  )
);

commit;
