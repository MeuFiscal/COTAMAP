alter table public.business_employees
  add column if not exists pin_hash text,
  add column if not exists last_access_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists presence_status text not null default 'offline';

alter table public.business_employees
  drop constraint if exists business_employees_presence_status_check;

alter table public.business_employees
  add constraint business_employees_presence_status_check
  check (presence_status in ('online', 'away', 'offline'));

create or replace function public.verify_employee_pin(target_employee_id uuid, submitted_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare valid_pin boolean;
begin
  if auth.uid() is null or submitted_pin !~ '^[0-9]{4}([0-9]{2})?$' then
    return false;
  end if;
  select (pin_hash is not null and crypt(submitted_pin, pin_hash) = pin_hash)
    into valid_pin
  from public.business_employees target
  where target.id = target_employee_id
    and exists (
      select 1 from public.business_employees supervisor
      where supervisor.business_id = target.business_id
        and supervisor.profile_id = auth.uid()
        and supervisor.role in ('owner', 'manager')
        and supervisor.is_active
        and supervisor.deleted_at is null
    )
    and target.is_active
    and target.deleted_at is null;
  return coalesce(valid_pin, false);
end;
$$;

revoke all on function public.verify_employee_pin(uuid, text) from public;
grant execute on function public.verify_employee_pin(uuid, text) to authenticated;

comment on column public.business_employees.pin_hash is 'Hash bcrypt/pgcrypto do PIN do operador; nunca armazenar PIN em texto puro.';
