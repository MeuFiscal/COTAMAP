create or replace function public.get_employee_pin_status(target_employee_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_employees target
    join public.business_employees actor on actor.business_id = target.business_id
    where target.id = target_employee_id
      and target.is_active
      and target.deleted_at is null
      and actor.profile_id = auth.uid()
      and actor.is_active
      and actor.deleted_at is null
      and (actor.profile_id = target.profile_id or actor.role in ('owner'::public.user_role, 'manager'::public.user_role))
  )
  and exists (
    select 1 from public.business_employees target
    where target.id = target_employee_id and target.pin_hash is not null
  );
$$;

create or replace function public.set_initial_employee_pin(target_employee_id uuid, submitted_pin text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if auth.uid() is null or submitted_pin !~ '^[0-9]{4}([0-9]{2})?$' then
    return false;
  end if;

  update public.business_employees
  set pin_hash = crypt(submitted_pin, gen_salt('bf', 10))
  where id = target_employee_id
    and profile_id = auth.uid()
    and role = 'owner'::public.user_role
    and is_active
    and deleted_at is null
    and pin_hash is null;
  return found;
end;
$$;

revoke all on function public.get_employee_pin_status(uuid) from public;
revoke all on function public.set_initial_employee_pin(uuid, text) from public;
grant execute on function public.get_employee_pin_status(uuid) to authenticated;
grant execute on function public.set_initial_employee_pin(uuid, text) to authenticated;
