begin;

create or replace function private.enforce_saas_quote_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  subscription public.business_subscriptions;
  active_plan public.saas_plans;
  usage_row public.saas_daily_usage;
begin
  select * into subscription
  from public.business_subscriptions
  where business_id = new.business_id and status = 'active'
  for update;

  if subscription.plan_id is not null then
    select * into active_plan from public.saas_plans where id = subscription.plan_id and is_active for share;
  else
    select * into active_plan from public.saas_plans where code = 'free' and is_active for share;
  end if;

  if active_plan.id is null then raise exception 'saas_plan_not_found'; end if;
  if active_plan.code = 'premium' or active_plan.daily_quote_limit is null then return new; end if;

  insert into public.saas_daily_usage (business_id, usage_date, quotes_received)
  values (new.business_id, current_date, 0)
  on conflict do nothing;
  select * into usage_row from public.saas_daily_usage
  where business_id = new.business_id and usage_date = current_date for update;
  if usage_row.quotes_received >= active_plan.daily_quote_limit then
    raise exception 'free_daily_quote_limit_reached';
  end if;
  update public.saas_daily_usage
  set quotes_received = quotes_received + 1
  where business_id = new.business_id and usage_date = current_date;
  return new;
end;
$$;

commit;
