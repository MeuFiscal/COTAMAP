alter table public.business_employees add column if not exists pin_requires_change boolean not null default false;

create or replace function public.hash_operator_pin(input_pin text)
returns text language sql security definer set search_path = public, extensions
as $$ select crypt(input_pin, gen_salt('bf', 10)); $$;

create or replace function public.verify_employee_pin_for_user(target_employee_id uuid, submitted_pin text, actor_id uuid)
returns boolean language sql security definer set search_path = public, extensions
as $$
  select exists (
    select 1 from public.business_employees target
    join public.business_employees actor on actor.business_id = target.business_id
    where target.id = target_employee_id and target.is_active and target.deleted_at is null
      and crypt(submitted_pin, target.pin_hash) = target.pin_hash
      and actor.profile_id = actor_id and actor.is_active and actor.deleted_at is null
      and (actor.profile_id = target.profile_id or actor.role in ('owner'::public.user_role, 'manager'::public.user_role))
  );
$$;

revoke all on function public.hash_operator_pin(text) from public;
revoke all on function public.verify_employee_pin_for_user(uuid, text, uuid) from public;
grant execute on function public.hash_operator_pin(text) to service_role;
grant execute on function public.verify_employee_pin_for_user(uuid, text, uuid) to service_role;
