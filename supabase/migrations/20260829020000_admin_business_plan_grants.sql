create table public.business_plan_grants (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.saas_plans(id),
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.business_plan_grants enable row level security;
revoke all on table public.business_plan_grants from anon, authenticated;
grant select, insert, update, delete on table public.business_plan_grants to service_role;

create or replace function private.apply_admin_business_plan_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grant_row public.business_plan_grants;
begin
  select * into grant_row
  from public.business_plan_grants
  where business_id = new.business_id and active
  limit 1;
  if grant_row.plan_id is not null then
    new.plan_id := grant_row.plan_id;
  end if;
  return new;
end;
$$;

drop trigger if exists preserve_admin_business_plan_grant on public.business_subscriptions;
create trigger preserve_admin_business_plan_grant
before insert or update of plan_id, status, provider, provider_status on public.business_subscriptions
for each row execute function private.apply_admin_business_plan_grant();

create or replace function public.set_business_plan(target_business uuid, target_plan uuid, target_actor uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.businesses where id = target_business and deleted_at is null) then
    raise exception 'business_not_found';
  end if;
  if not exists (select 1 from public.saas_plans where id = target_plan and is_active) then
    raise exception 'plan_not_found_or_inactive';
  end if;

  insert into public.business_plan_grants(business_id, plan_id, granted_by, active, granted_at, updated_at)
  values (target_business, target_plan, target_actor, true, now(), now())
  on conflict (business_id) do update set
    plan_id = excluded.plan_id,
    granted_by = excluded.granted_by,
    granted_at = now(),
    active = true,
    updated_at = now();

  insert into public.business_subscriptions(business_id, plan_id, status, activated_at, changed_at, provider, provider_status)
  values (target_business, target_plan, 'active', now(), now(), null, 'admin_granted')
  on conflict (business_id) do update set
    plan_id = excluded.plan_id,
    status = 'active',
    changed_at = now();
end;
$$;

revoke all on function public.set_business_plan(uuid, uuid, uuid) from public;
grant execute on function public.set_business_plan(uuid, uuid, uuid) to service_role;
