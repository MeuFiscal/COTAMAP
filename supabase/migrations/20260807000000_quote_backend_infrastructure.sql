begin;

-- Solicitações precisam preservar os dados estruturados usados pelo fluxo real.
alter table public.quote_requests
  add column if not exists business_category_id uuid,
  add column if not exists part_name text,
  add column if not exists vehicle_brand text,
  add column if not exists vehicle_model text,
  add column if not exists vehicle_year smallint,
  add column if not exists vehicle_engine text,
  add column if not exists observation text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quote_requests_category_fk'
  ) then
    alter table public.quote_requests
      add constraint quote_requests_category_fk foreign key (business_category_id)
      references public.business_categories (id) on update cascade on delete restrict;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace
      and typname = 'notification_status'
  ) then
    create type public.notification_status as enum ('pending', 'sent', 'responded', 'rejected', 'ignored', 'expired', 'cancelled');
  end if;
end;
$$;

alter table public.quote_notifications
  add column if not exists status public.notification_status not null default 'pending',
  add column if not exists dispatch_order smallint,
  add column if not exists distance_meters numeric(12, 2),
  add column if not exists expires_at timestamptz,
  add column if not exists responded_at timestamptz;

create index if not exists quote_requests_category_status_idx
  on public.quote_requests (business_category_id, status, created_at desc)
  where deleted_at is null;

create index if not exists quote_notifications_request_status_order_idx
  on public.quote_notifications (quote_request_id, status, dispatch_order)
  where deleted_at is null;

create index if not exists quote_notifications_expiration_idx
  on public.quote_notifications (status, expires_at)
  where deleted_at is null and expires_at is not null;

-- Bucket privado para fotos de solicitações. O caminho inicia pelo profile id.
insert into storage.buckets (id, name, public)
values ('quote-request-images', 'quote-request-images', false)
on conflict (id) do update set public = excluded.public;

drop policy if exists "quote_request_images_storage_insert" on storage.objects;
create policy "quote_request_images_storage_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'quote-request-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "quote_request_images_storage_select" on storage.objects;
create policy "quote_request_images_storage_select"
on storage.objects for select to authenticated
using (
  bucket_id = 'quote-request-images'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or exists (
      select 1
      from public.quote_request_images as image
      inner join public.quote_requests as request on request.id = image.quote_request_id
      where image.storage_path = name
        and request.deleted_at is null
        and (
          request.customer_id = (select auth.uid())
          or (select private.can_access_quote_request(request.id))
        )
    )
  )
);

drop policy if exists "quote_request_images_storage_delete" on storage.objects;
create policy "quote_request_images_storage_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'quote-request-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create or replace function public.buscar_empresas_por_raio(
  target_latitude numeric,
  target_longitude numeric,
  target_radius_meters integer,
  target_category_id uuid default null
)
returns table (
  business_id uuid,
  business_name text,
  logo_url text,
  latitude numeric,
  longitude numeric,
  distance_meters numeric
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    business.id,
    business.name,
    business.logo_url,
    business.latitude,
    business.longitude,
    round(st_distance(
      business.location,
      st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography
    )::numeric, 2)
  from public.businesses as business
  where business.status = 'active'::public.business_status
    and business.deleted_at is null
    and business.location is not null
    and (target_category_id is null or business.business_category_id = target_category_id)
    and st_dwithin(
      business.location,
      st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography,
      target_radius_meters
    )
  order by business.location <-> st_setsrid(
    st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326
  )::geography;
$$;

create or replace function public.criar_notificacoes(target_request_id uuid)
returns setof public.quote_notifications
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_row public.quote_requests;
  selected_business record;
  next_order smallint := 1;
begin
  select * into request_row
  from public.quote_requests
  where id = target_request_id and deleted_at is null
  for update;

  if request_row.id is null then
    raise exception 'quote_request_not_found';
  end if;
  if request_row.status <> 'waiting'::public.quote_status then
    raise exception 'quote_request_not_waiting';
  end if;
  if auth.role() <> 'service_role' and request_row.customer_id <> auth.uid() then
    raise exception 'not_authorized';
  end if;

  for selected_business in
    select * from public.buscar_empresas_por_raio(
      request_row.latitude,
      request_row.longitude,
      request_row.radius_meters,
      request_row.business_category_id
    ) limit 5
  loop
    insert into public.quote_notifications (
      quote_request_id, business_id, sent_at, status, dispatch_order,
      distance_meters, expires_at
    ) values (
      request_row.id, selected_business.business_id, now(), 'pending', next_order,
      selected_business.distance_meters, coalesce(request_row.expires_at, now() + interval '7 minutes')
    )
    on conflict (quote_request_id, business_id) where deleted_at is null do nothing;
    next_order := next_order + 1;
  end loop;

  return query
    select notification.*
    from public.quote_notifications as notification
    where notification.quote_request_id = target_request_id
      and notification.deleted_at is null
    order by notification.dispatch_order;
end;
$$;

create or replace function public.promover_proxima_empresa(target_request_id uuid)
returns public.quote_notifications
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_row public.quote_requests;
  next_business record;
  promoted public.quote_notifications;
begin
  select * into request_row from public.quote_requests
  where id = target_request_id and deleted_at is null for update;
  if request_row.id is null then raise exception 'quote_request_not_found'; end if;
  if auth.role() <> 'service_role' and request_row.customer_id <> auth.uid() then raise exception 'not_authorized'; end if;
  if request_row.status <> 'waiting'::public.quote_status or coalesce(request_row.expires_at, now()) <= now() then
    return null;
  end if;
  if (select count(*) from public.quote_notifications where quote_request_id = target_request_id and status = 'pending' and deleted_at is null) >= 5 then
    return null;
  end if;

  select eligible.* into next_business
  from public.buscar_empresas_por_raio(request_row.latitude, request_row.longitude, request_row.radius_meters, request_row.business_category_id) eligible
  where not exists (
    select 1 from public.quote_notifications existing
    where existing.quote_request_id = target_request_id
      and existing.business_id = eligible.business_id
      and existing.deleted_at is null
  )
  order by eligible.distance_meters
  limit 1;

  if not found then return null; end if;
  insert into public.quote_notifications (
    quote_request_id, business_id, sent_at, status, dispatch_order, distance_meters, expires_at
  ) values (
    target_request_id, next_business.business_id, now(), 'pending',
    coalesce((select max(dispatch_order) from public.quote_notifications where quote_request_id = target_request_id), 0) + 1,
    next_business.distance_meters, coalesce(request_row.expires_at, now() + interval '7 minutes')
  ) returning * into promoted;
  return promoted;
end;
$$;

create or replace function public.expirar_solicitacao(target_request_id uuid)
returns public.quote_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_request public.quote_requests;
begin
  if auth.role() <> 'service_role' and not exists (
    select 1 from public.quote_requests where id = target_request_id and customer_id = auth.uid()
  ) then raise exception 'not_authorized'; end if;
  update public.quote_requests
  set status = 'expired'::public.quote_status, updated_at = now()
  where id = target_request_id and deleted_at is null and status = 'waiting'::public.quote_status
  returning * into expired_request;
  update public.quote_notifications
  set status = 'expired'::public.notification_status, updated_at = now()
  where quote_request_id = target_request_id and deleted_at is null and status in ('pending', 'sent');
  return expired_request;
end;
$$;

revoke all on function public.buscar_empresas_por_raio(numeric, numeric, integer, uuid) from public, anon, authenticated;
revoke all on function public.criar_notificacoes(uuid) from public, anon, authenticated;
revoke all on function public.promover_proxima_empresa(uuid) from public, anon, authenticated;
revoke all on function public.expirar_solicitacao(uuid) from public, anon, authenticated;
grant execute on function public.criar_notificacoes(uuid) to authenticated;
grant execute on function public.expirar_solicitacao(uuid) to authenticated;
grant execute on function public.buscar_empresas_por_raio(numeric, numeric, integer, uuid) to service_role;
grant execute on function public.criar_notificacoes(uuid) to service_role;
grant execute on function public.promover_proxima_empresa(uuid) to service_role;
grant execute on function public.expirar_solicitacao(uuid) to service_role;

alter table public.quote_requests replica identity full;
alter table public.quote_notifications replica identity full;
alter table public.quotations replica identity full;
alter table public.orders replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quote_requests') then
    alter publication supabase_realtime add table public.quote_requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quote_notifications') then
    alter publication supabase_realtime add table public.quote_notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'quotations') then
    alter publication supabase_realtime add table public.quotations;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;

commit;
