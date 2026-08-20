-- admin-core uses service_role for these reads and for the checkout update path.
grant select, update
on table public.saas_checkouts
to service_role;

grant select
on table public.saas_daily_usage,
           public.quotations,
           public.orders
to service_role;
