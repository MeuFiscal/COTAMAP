-- Only businesses with at least one active online operator participate in new distributions.
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
  select business.id, business.name, business.logo_url, business.latitude, business.longitude,
    round(st_distance(business.location, st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography)::numeric, 2)
  from public.businesses business
  where business.status = 'active'::public.business_status
    and business.deleted_at is null and business.location is not null
    and (target_category_id is null or business.business_category_id = target_category_id)
    and exists (select 1 from public.business_employees operator where operator.business_id = business.id and operator.is_active and operator.deleted_at is null and operator.presence_status = 'online')
    and st_dwithin(business.location, st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography, target_radius_meters)
  order by business.location <-> st_setsrid(st_makepoint(target_longitude::double precision, target_latitude::double precision), 4326)::geography;
$$;
