-- Distribuição V2: parâmetros persistidos e seleção espacial com score.
create table if not exists public.distribution_settings (
  id boolean primary key default true check (id),
  initial_radius_meters integer not null default 5000 check (initial_radius_meters > 0),
  max_radius_meters integer not null default 80000 check (max_radius_meters >= initial_radius_meters),
  initial_business_count smallint not null default 5 check (initial_business_count > 0),
  promotion_pending_limit smallint not null default 5 check (promotion_pending_limit > 0),
  distance_weight numeric(5,4) not null default 0.40,
  response_weight numeric(5,4) not null default 0.20,
  acceptance_weight numeric(5,4) not null default 0.15,
  availability_weight numeric(5,4) not null default 0.10,
  balance_weight numeric(5,4) not null default 0.10,
  reputation_weight numeric(5,4) not null default 0.05,
  updated_at timestamptz not null default now(),
  constraint distribution_settings_weights check (distance_weight + response_weight + acceptance_weight + availability_weight + balance_weight + reputation_weight = 1)
);
insert into public.distribution_settings(id) values (true) on conflict (id) do nothing;

alter table public.distribution_settings enable row level security;
drop policy if exists distribution_settings_read on public.distribution_settings;
create policy distribution_settings_read on public.distribution_settings for select to authenticated using (true);

create index if not exists quote_notifications_business_created_idx
  on public.quote_notifications (business_id, created_at desc) where deleted_at is null;
create index if not exists quotations_business_created_idx
  on public.quotations (business_id, created_at desc) where deleted_at is null;

create or replace function public.business_is_open(hours jsonb, at_time timestamptz default now())
returns boolean language plpgsql immutable
as $$
declare day_key text := lower(to_char(at_time at time zone 'America/Sao_Paulo', 'dy'));
declare schedule jsonb := hours -> day_key;
declare current_time_text text := to_char(at_time at time zone 'America/Sao_Paulo', 'HH24:MI');
begin
  if hours is null or hours = '{}'::jsonb or schedule is null then return true; end if;
  if coalesce((schedule->>'closed')::boolean, false) then return false; end if;
  if schedule->>'open' is null or schedule->>'close' is null then return true; end if;
  return current_time_text >= schedule->>'open' and current_time_text < schedule->>'close';
exception when others then return true;
end;
$$;

create or replace function public.buscar_empresas_inteligente(
  target_latitude numeric,
  target_longitude numeric,
  target_category_id uuid default null
)
returns table (
  business_id uuid,
  business_name text,
  logo_url text,
  latitude numeric,
  longitude numeric,
  distance_meters numeric,
  score numeric
)
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  settings public.distribution_settings;
  search_radius integer;
  point geography;
begin
  select * into settings from public.distribution_settings where id = true;
  point := st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography;
  search_radius := settings.initial_radius_meters;
  while search_radius <= settings.max_radius_meters loop
    return query
    with eligible as (
      select b.id, b.name, b.logo_url, b.latitude, b.longitude,
        round(st_distance(b.location, point)::numeric, 2) as distance_meters,
        coalesce(avg(extract(epoch from (n.responded_at - n.sent_at))) filter (where n.responded_at is not null), 1800) as response_seconds,
        count(n.id) filter (where n.created_at >= current_date) as received_today,
        count(n.id) filter (where n.status in ('responded','rejected')) as handled,
        count(n.id) filter (where n.status = 'responded') as accepted,
        count(e.id) filter (where e.is_active and e.presence_status = 'online') as online_operators
      from public.businesses b
      left join public.quote_notifications n on n.business_id = b.id and n.deleted_at is null
      left join public.business_employees e on e.business_id = b.id and e.deleted_at is null
      where b.status = 'active' and b.deleted_at is null and b.location is not null
        and b.is_available_for_requests = true
        and (target_category_id is null or b.business_category_id = target_category_id)
        and public.business_is_open(b.opening_hours, now())
        and st_dwithin(b.location, point, search_radius)
      group by b.id, b.name, b.logo_url, b.latitude, b.longitude, b.location
      having count(e.id) filter (where e.is_active and e.presence_status = 'online') > 0
    ), scored as (
      select eligible.*, (
        settings.distance_weight * (1 - least(eligible.distance_meters / greatest(search_radius, 1), 1)) +
        settings.response_weight * (1 - least(eligible.response_seconds / 3600, 1)) +
        settings.acceptance_weight * (case when eligible.handled = 0 then 0.5 else eligible.accepted::numeric / eligible.handled end) +
        settings.availability_weight * least(eligible.online_operators::numeric / 3, 1) +
        settings.balance_weight * (1 - least(eligible.received_today::numeric / 20, 1)) +
        settings.reputation_weight * 0.5
      ) as score
      from eligible
    )
    select scored.id, scored.name, scored.logo_url, scored.latitude, scored.longitude, scored.distance_meters, round(scored.score, 6)
    from scored order by scored.score desc, scored.distance_meters asc;
    if found then return; end if;
    search_radius := least(search_radius * 2, settings.max_radius_meters + 1);
  end loop;
end;
$$;

revoke all on function public.buscar_empresas_inteligente(numeric, numeric, uuid) from public, anon, authenticated;
grant execute on function public.buscar_empresas_inteligente(numeric, numeric, uuid) to service_role;

create or replace function public.criar_notificacoes(target_request_id uuid)
returns setof public.quote_notifications
language plpgsql security definer set search_path = public, extensions
as $$
declare request_row public.quote_requests; candidate record; next_order smallint := 1; settings public.distribution_settings;
begin
  select * into request_row from public.quote_requests where id = target_request_id and deleted_at is null for update;
  if request_row.id is null then raise exception 'quote_request_not_found'; end if;
  if request_row.status <> 'waiting'::public.quote_status then raise exception 'quote_request_not_waiting'; end if;
  if auth.role() <> 'service_role' and request_row.customer_id <> auth.uid() then raise exception 'not_authorized'; end if;
  select * into settings from public.distribution_settings where id = true;
  for candidate in select * from public.buscar_empresas_inteligente(request_row.latitude, request_row.longitude, request_row.business_category_id) limit settings.initial_business_count loop
    insert into public.quote_notifications(quote_request_id, business_id, sent_at, status, dispatch_order, distance_meters, expires_at)
    values (request_row.id, candidate.business_id, now(), 'pending', next_order, candidate.distance_meters, coalesce(request_row.expires_at, now() + interval '7 minutes'))
    on conflict (quote_request_id, business_id) where deleted_at is null do nothing;
    next_order := next_order + 1;
  end loop;
  return query select notification.* from public.quote_notifications notification where notification.quote_request_id = target_request_id and notification.deleted_at is null order by notification.dispatch_order;
end;
$$;
grant execute on function public.criar_notificacoes(uuid) to service_role;

create or replace function public.promover_proxima_empresa(target_request_id uuid)
returns public.quote_notifications
language plpgsql security definer set search_path = public, extensions
as $$
declare request_row public.quote_requests; candidate record; promoted public.quote_notifications; settings public.distribution_settings;
begin
  select * into request_row from public.quote_requests where id = target_request_id and deleted_at is null for update;
  if request_row.id is null then raise exception 'quote_request_not_found'; end if;
  if request_row.status <> 'waiting'::public.quote_status or coalesce(request_row.expires_at, now()) <= now() then return null; end if;
  select * into settings from public.distribution_settings where id = true;
  if (select count(*) from public.quote_notifications where quote_request_id = target_request_id and status = 'pending' and deleted_at is null) >= settings.promotion_pending_limit then return null; end if;
  select eligible.* into candidate from public.buscar_empresas_inteligente(request_row.latitude, request_row.longitude, request_row.business_category_id) eligible
  where not exists (select 1 from public.quote_notifications existing where existing.quote_request_id = target_request_id and existing.business_id = eligible.business_id and existing.deleted_at is null)
  limit 1;
  if not found then return null; end if;
  insert into public.quote_notifications(quote_request_id, business_id, sent_at, status, dispatch_order, distance_meters, expires_at)
  values(target_request_id, candidate.business_id, now(), 'pending', coalesce((select max(dispatch_order) from public.quote_notifications where quote_request_id = target_request_id), 0) + 1, candidate.distance_meters, coalesce(request_row.expires_at, now() + interval '7 minutes')) returning * into promoted;
  return promoted;
end;
$$;
grant execute on function public.promover_proxima_empresa(uuid) to service_role;
