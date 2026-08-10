create or replace function public.cancel_quote_request(target_request_id uuid, target_customer_id uuid)
returns public.quote_requests
language plpgsql
security definer
set search_path = public
as $$
declare request_row public.quote_requests;
begin
  select * into request_row from public.quote_requests
    where id = target_request_id and customer_id = target_customer_id and deleted_at is null for update;
  if request_row.id is null then raise exception 'request_not_found'; end if;
  if request_row.status <> 'waiting'::public.quote_status then raise exception 'request_not_cancellable'; end if;
  update public.quote_requests set status = 'cancelled'::public.quote_status, updated_at = now()
    where id = request_row.id returning * into request_row;
  update public.quote_notifications set status = 'cancelled'::public.notification_status, updated_at = now()
    where quote_request_id = request_row.id and deleted_at is null and status in ('pending'::public.notification_status, 'sent'::public.notification_status);
  return request_row;
end;
$$;
revoke all on function public.cancel_quote_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.cancel_quote_request(uuid, uuid) to service_role;
