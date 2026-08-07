begin;

insert into storage.buckets (id, name, public)
values ('quotation-images', 'quotation-images', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "quotation_images_storage_insert" on storage.objects;
create policy "quotation_images_storage_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'quotation-images'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role in ('owner'::public.user_role, 'manager'::public.user_role, 'employee'::public.user_role)
      and membership.is_active
      and membership.deleted_at is null
  )
);

drop policy if exists "quotation_images_storage_select" on storage.objects;
create policy "quotation_images_storage_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'quotation-images'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role in ('owner'::public.user_role, 'manager'::public.user_role, 'employee'::public.user_role)
      and membership.is_active
      and membership.deleted_at is null
  )
);

drop policy if exists "quotation_images_storage_delete" on storage.objects;
create policy "quotation_images_storage_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'quotation-images'
  and (storage.foldername(name))[1]::uuid in (
    select membership.business_id
    from public.business_employees membership
    where membership.profile_id = (select auth.uid())
      and membership.role in ('owner'::public.user_role, 'manager'::public.user_role, 'employee'::public.user_role)
      and membership.is_active
      and membership.deleted_at is null
  )
);

drop policy if exists "quote_notifications_update_business_members" on public.quote_notifications;
create policy "quote_notifications_update_business_members"
on public.quote_notifications for update to authenticated
using (
  (select private.can_respond_for_business(business_id))
  and status in ('pending'::public.notification_status, 'sent'::public.notification_status)
)
with check (
  (select private.can_respond_for_business(business_id))
);

create or replace function public.responder_cotacao(
  target_notification_id uuid,
  target_actor_profile_id uuid,
  target_action text,
  target_amount numeric default null,
  target_brand text default null,
  target_notes text default null,
  target_response_time_seconds integer default null,
  target_image_path text default null,
  target_image_file_name text default null,
  target_image_mime_type text default null,
  target_image_size_bytes bigint default null
)
returns public.quotations
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_row public.quote_notifications;
  request_row public.quote_requests;
  quotation_row public.quotations;
begin
  if target_action not in ('accept', 'reject') then raise exception 'invalid_action'; end if;
  select * into notification_row
  from public.quote_notifications
  where id = target_notification_id and deleted_at is null
  for update;
  if notification_row.id is null then raise exception 'notification_not_found'; end if;
  if not exists (
    select 1 from public.business_employees membership
    where membership.business_id = notification_row.business_id
      and membership.profile_id = target_actor_profile_id
      and membership.role in ('owner'::public.user_role, 'manager'::public.user_role, 'employee'::public.user_role)
      and membership.is_active and membership.deleted_at is null
  ) then raise exception 'business_member_not_authorized'; end if;
  if notification_row.status not in ('pending'::public.notification_status, 'sent'::public.notification_status) then raise exception 'notification_not_active'; end if;

  select * into request_row from public.quote_requests
  where id = notification_row.quote_request_id and deleted_at is null for update;
  if request_row.id is null or request_row.status <> 'waiting'::public.quote_status or coalesce(request_row.expires_at, now()) <= now() then raise exception 'request_expired'; end if;

  if target_action = 'reject' then
    update public.quote_notifications set status = 'rejected', responded_at = now(), updated_at = now() where id = notification_row.id;
    perform public.promover_proxima_empresa(request_row.id);
    return null;
  end if;
  if target_amount is null or target_amount < 0 then raise exception 'invalid_amount'; end if;

  insert into public.quotations (quote_request_id, business_id, submitted_by_profile_id, amount, brand, notes, status, response_time_seconds, expires_at)
  values (request_row.id, notification_row.business_id, target_actor_profile_id, target_amount, target_brand, target_notes, 'sent', target_response_time_seconds, request_row.expires_at)
  returning * into quotation_row;

  if target_image_path is not null then
    insert into public.quotation_images (quotation_id, storage_path, file_name, mime_type, size_bytes)
    values (quotation_row.id, target_image_path, target_image_file_name, target_image_mime_type, target_image_size_bytes);
  end if;
  update public.quote_notifications set status = 'responded', responded_at = now(), updated_at = now() where id = notification_row.id;
  update public.quote_requests set status = 'accepted', updated_at = now() where id = request_row.id;
  return quotation_row;
end;
$$;

revoke all on function public.responder_cotacao(uuid, uuid, text, numeric, text, text, integer, text, text, text, bigint) from public, anon, authenticated;
grant execute on function public.responder_cotacao(uuid, uuid, text, numeric, text, text, integer, text, text, text, bigint) to service_role;

commit;
