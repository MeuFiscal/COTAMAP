-- Customers may see dispatch notifications created for their own requests.
-- The request ownership check keeps this scoped to the authenticated customer.
create policy "quote_notifications_select_request_customer"
on public.quote_notifications for select to authenticated
using (
  exists (
    select 1
    from public.quote_requests as request
    where request.id = quote_notifications.quote_request_id
      and request.customer_id = (select auth.uid())
      and request.deleted_at is null
  )
);

-- Business identity is exposed only when it belongs to a notification for the
-- authenticated customer's own request; membership/admin access remains intact.
create or replace function private.can_view_notified_business(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quote_notifications as notification
    join public.quote_requests as request on request.id = notification.quote_request_id
    where notification.business_id = target_business_id
      and notification.deleted_at is null
      and request.deleted_at is null
      and request.customer_id = auth.uid()
  );
$$;

grant execute on function private.can_view_notified_business(uuid) to authenticated;

create policy "businesses_select_notified_customer"
on public.businesses for select to authenticated
using ((select private.can_view_notified_business(id)));
