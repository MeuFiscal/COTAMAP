-- Distribuição: somente empresas explicitamente disponíveis recebem novos chamados.
-- Mantém os demais critérios (localização, horário, operador online e score).
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
      where b.status = 'active' and b.deleted_at is null
        and b.is_available_for_requests = true
        and b.location is not null
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
    select scored.id, scored.name, scored.logo_url, scored.latitude, scored.longitude,
      scored.distance_meters, round(scored.score, 6)
    from scored order by scored.score desc, scored.distance_meters asc;
    if found then return; end if;
    search_radius := least(search_radius * 2, settings.max_radius_meters + 1);
  end loop;
end;
$$;

revoke all on function public.buscar_empresas_inteligente(numeric, numeric, uuid) from public, anon, authenticated;
grant execute on function public.buscar_empresas_inteligente(numeric, numeric, uuid) to service_role;
