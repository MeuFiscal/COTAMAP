create or replace function public.escolher_cotacao(
  target_quotation_id uuid,
  target_customer_id uuid
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  selected public.quotations;
  request_row public.quote_requests;
  created_order public.orders;
begin
  select * into selected from public.quotations where id = target_quotation_id and deleted_at is null for update;
  if selected.id is null then raise exception 'quotation_not_found'; end if;
  select * into request_row from public.quote_requests where id = selected.quote_request_id and deleted_at is null for update;
  if request_row.id is null or request_row.customer_id <> target_customer_id then raise exception 'not_request_owner'; end if;
  if request_row.status <> 'waiting'::public.quote_status or coalesce(request_row.expires_at, now()) <= now() then raise exception 'request_expired'; end if;
  if selected.status not in ('sent'::public.quotation_status, 'pending'::public.quotation_status) then raise exception 'quotation_unavailable'; end if;
  if exists (select 1 from public.orders existing join public.quotations q on q.id = existing.quotation_id where q.quote_request_id = request_row.id and existing.deleted_at is null) then raise exception 'order_already_exists'; end if;

  insert into public.orders (quotation_id, status) values (selected.id, 'pending'::public.order_status) returning * into created_order;
  update public.quotations set status = 'accepted'::public.quotation_status, updated_at = now() where id = selected.id;
  update public.quotations set status = 'rejected'::public.quotation_status, updated_at = now() where quote_request_id = request_row.id and id <> selected.id and deleted_at is null and status in ('sent'::public.quotation_status, 'pending'::public.quotation_status);
  update public.quote_requests set status = 'accepted'::public.quote_status, updated_at = now() where id = request_row.id;
  update public.quote_notifications set status = 'cancelled'::public.notification_status, updated_at = now() where quote_request_id = request_row.id and deleted_at is null and status in ('pending'::public.notification_status, 'sent'::public.notification_status);
  insert into public.audit_logs (actor_profile_id, entity_type, entity_id, action, metadata) values (target_customer_id, 'order', created_order.id, 'quotation_chosen', jsonb_build_object('quotation_id', selected.id, 'business_id', selected.business_id, 'quote_request_id', request_row.id));
  return created_order;
exception when unique_violation then
  raise exception 'order_already_exists';
end;
$$;

revoke all on function public.escolher_cotacao(uuid, uuid) from public, anon, authenticated;
grant execute on function public.escolher_cotacao(uuid, uuid) to service_role;
