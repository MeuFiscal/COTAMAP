create or replace function public.atualizar_status_pedido(
  target_order_id uuid,
  target_actor_profile_id uuid,
  target_status public.order_status
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  current_order public.orders;
  quotation_row public.quotations;
  membership public.business_employees;
begin
  select * into current_order from public.orders where id = target_order_id and deleted_at is null for update;
  if current_order.id is null then raise exception 'order_not_found'; end if;
  if current_order.status = 'completed'::public.order_status then raise exception 'order_completed'; end if;
  select * into quotation_row from public.quotations where id = current_order.quotation_id and deleted_at is null;
  if quotation_row.id is null then raise exception 'quotation_not_found'; end if;
  select * into membership from public.business_employees where business_id = quotation_row.business_id and profile_id = target_actor_profile_id and is_active and deleted_at is null for update;
  if membership.id is null or membership.role not in ('owner'::public.user_role, 'manager'::public.user_role, 'employee'::public.user_role) then raise exception 'employee_not_authorized'; end if;
  if (current_order.status, target_status) not in (
    ('pending'::public.order_status, 'preparing'::public.order_status),
    ('preparing'::public.order_status, 'ready'::public.order_status),
    ('ready'::public.order_status, 'completed'::public.order_status)
  ) then raise exception 'invalid_order_transition'; end if;
  update public.orders set status = target_status, updated_at = now() where id = target_order_id returning * into current_order;
  insert into public.audit_logs (actor_profile_id, entity_type, entity_id, action, old_values, new_values, metadata)
  values (target_actor_profile_id, 'order', target_order_id, 'status_changed', jsonb_build_object('status', case when target_status = 'preparing' then 'pending' else case when target_status = 'ready' then 'preparing' else 'ready' end end), jsonb_build_object('status', target_status), jsonb_build_object('business_id', quotation_row.business_id));
  return current_order;
end;
$$;

revoke all on function public.atualizar_status_pedido(uuid, uuid, public.order_status) from public, anon, authenticated;
grant execute on function public.atualizar_status_pedido(uuid, uuid, public.order_status) to service_role;
