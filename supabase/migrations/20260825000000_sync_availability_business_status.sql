-- Empresas só participam da distribuição quando o operador as coloca disponíveis.
create or replace function public.set_my_business_availability(p_is_available boolean)
returns boolean language plpgsql security definer set search_path = public
as $$
declare updated boolean;
begin
  update public.businesses as business
  set is_available_for_requests = p_is_available,
      status = case
        when p_is_available and business.status = 'inactive'::public.business_status then 'active'::public.business_status
        when not p_is_available and business.status = 'active'::public.business_status then 'inactive'::public.business_status
        else business.status
      end,
      availability_updated_at = now(), updated_at = now()
  where business.id in (
    select membership.business_id from public.business_employees membership
    where membership.profile_id = auth.uid() and membership.is_active = true
      and membership.deleted_at is null and membership.role in ('owner'::public.user_role, 'manager'::public.user_role)
  ) and business.deleted_at is null and business.status <> 'blocked'::public.business_status
  returning true into updated;
  if updated is null then raise exception using errcode = '42501', message = 'Usuário não possui permissão para alterar a disponibilidade desta empresa.'; end if;
  return updated;
end;
$$;
revoke all on function public.set_my_business_availability(boolean) from public;
grant execute on function public.set_my_business_availability(boolean) to authenticated;
