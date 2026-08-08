create or replace function public.set_my_business_availability(p_is_available boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated boolean;
begin
  update public.businesses as business
  set is_available_for_requests = p_is_available,
      availability_updated_at = now(),
      updated_at = now()
  where business.id in (
    select membership.business_id
    from public.business_employees as membership
    where membership.profile_id = auth.uid()
      and membership.is_active = true
      and membership.deleted_at is null
      and membership.role in ('owner'::public.user_role, 'manager'::public.user_role)
  )
    and business.deleted_at is null
  returning true into updated;

  if updated is null then
    raise exception using errcode = '42501', message = 'Usuário não possui permissão para alterar a disponibilidade desta empresa.';
  end if;
  return updated;
end;
$$;

revoke all on function public.set_my_business_availability(boolean) from public;
grant execute on function public.set_my_business_availability(boolean) to authenticated;
