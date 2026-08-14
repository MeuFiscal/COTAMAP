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
  select * into subscription from public.business_subscriptions
  where business_id = new.business_id and status = 'active' for update;

  if subscription.plan_id is not null then
    select * into active_plan from public.saas_plans
    where id = subscription.plan_id and is_active for share;
  else
    select * into active_plan from public.saas_plans
    where is_default_free and is_active
    order by sort_order, created_at limit 1 for share;
    if active_plan.id is null then
      select * into active_plan from public.saas_plans
      where code = 'free' and is_active
      order by created_at limit 1 for share;
    end if;
  end if;

  if active_plan.id is null then raise exception 'saas_plan_not_found'; end if;
  if active_plan.is_unlimited then return new; end if;
  if active_plan.daily_quote_limit is null or active_plan.daily_quote_limit < 0 then return null; end if;

  insert into public.saas_daily_usage (business_id, usage_date, quotes_received)
  values (new.business_id, current_date, 0) on conflict do nothing;
  select * into usage_row from public.saas_daily_usage
  where business_id = new.business_id and usage_date = current_date for update;
  if usage_row.quotes_received >= active_plan.daily_quote_limit then return null; end if;
  update public.saas_daily_usage set quotes_received = quotes_received + 1
  where business_id = new.business_id and usage_date = current_date;
  return new;
end;
$$;

create or replace function public.criar_notificacoes(target_request_id uuid)
returns setof public.quote_notifications
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
 request_row public.quote_requests;
 candidate record;
 next_order smallint := 1;
 settings public.distribution_settings;
 daily_limit integer;
 plan_unlimited boolean;
 used_today integer;
 has_subscription boolean;
begin
 select * into request_row from public.quote_requests
 where id=target_request_id and deleted_at is null for update;
 if request_row.id is null then raise exception 'quote_request_not_found'; end if;
 if auth.role() <> 'service_role' and request_row.customer_id <> auth.uid() then raise exception 'not_authorized'; end if;
 select * into settings from public.distribution_settings where id=true;

 for candidate in
   select * from public.buscar_empresas_inteligente(request_row.latitude,request_row.longitude,request_row.business_category_id)
   limit coalesce(settings.initial_business_count,5)
 loop
   has_subscription := false;
   plan_unlimited := false;
   daily_limit := null;

   select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
   from public.business_subscriptions s join public.saas_plans p on p.id=s.plan_id
   where s.business_id=candidate.business_id and s.status='active' and p.is_active limit 1;

   if found then
     has_subscription := true;
   else
     select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
     from public.saas_plans p where p.is_default_free and p.is_active
     order by p.sort_order, p.created_at limit 1;
     if not found then
       select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
       from public.saas_plans p where p.code='free' and p.is_active
       order by p.created_at limit 1;
     end if;
   end if;

   if not exists (
     select 1 from public.platform_admins a
     join public.business_employees e on e.business_id=candidate.business_id
       and e.role='owner' and e.is_active and e.deleted_at is null
     join auth.users u on u.id=e.profile_id
     where lower(a.email)=lower(u.email) and a.active
   ) then
     select count(*) into used_today from public.quote_notifications n
     where n.business_id=candidate.business_id and n.deleted_at is null
       and n.created_at>=date_trunc('day',now());

     if plan_unlimited or (daily_limit is not null and daily_limit >= 0 and used_today < daily_limit) then
       insert into public.quote_notifications(quote_request_id,business_id,sent_at,status,dispatch_order,distance_meters,expires_at)
       values(target_request_id,candidate.business_id,now(),'pending',next_order,candidate.distance_meters,
         coalesce(request_row.expires_at,now()+interval '7 minutes'))
       on conflict (quote_request_id,business_id) where deleted_at is null do nothing;
       next_order:=next_order+1;
     end if;
   else
     insert into public.quote_notifications(quote_request_id,business_id,sent_at,status,dispatch_order,distance_meters,expires_at)
     values(target_request_id,candidate.business_id,now(),'pending',next_order,candidate.distance_meters,
       coalesce(request_row.expires_at,now()+interval '7 minutes'))
     on conflict (quote_request_id,business_id) where deleted_at is null do nothing;
     next_order:=next_order+1;
   end if;
 end loop;

 return query select n.* from public.quote_notifications n
 where n.quote_request_id=target_request_id and n.deleted_at is null
 order by n.dispatch_order;
end;
$function$;

create or replace function public.promover_proxima_empresa(target_request_id uuid)
returns public.quote_notifications
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
 request_row public.quote_requests;
 candidate record;
 promoted public.quote_notifications;
 settings public.distribution_settings;
 daily_limit integer;
 plan_unlimited boolean;
 used_today integer;
begin
 select * into request_row from public.quote_requests
 where id=target_request_id and deleted_at is null for update;
 if request_row.id is null then raise exception 'quote_request_not_found'; end if;
 if request_row.status <> 'waiting'::public.quote_status
    or coalesce(request_row.expires_at, now()) <= now() then return null; end if;
 select * into settings from public.distribution_settings where id=true;
 if (select count(*) from public.quote_notifications
     where quote_request_id=target_request_id and status='pending' and deleted_at is null)
    >= settings.promotion_pending_limit then return null; end if;

 for candidate in
   select eligible.* from public.buscar_empresas_inteligente(
     request_row.latitude,request_row.longitude,request_row.business_category_id) eligible
   where not exists (
     select 1 from public.quote_notifications existing
     where existing.quote_request_id=target_request_id
       and existing.business_id=eligible.business_id and existing.deleted_at is null)
 loop
   plan_unlimited := false;
   daily_limit := null;

   select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
   from public.business_subscriptions s join public.saas_plans p on p.id=s.plan_id
   where s.business_id=candidate.business_id and s.status='active' and p.is_active limit 1;

   if not found then
     select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
     from public.saas_plans p where p.is_default_free and p.is_active
     order by p.sort_order, p.created_at limit 1;
     if not found then
       select p.is_unlimited, p.daily_quote_limit into plan_unlimited, daily_limit
       from public.saas_plans p where p.code='free' and p.is_active
       order by p.created_at limit 1;
     end if;
   end if;

   if not plan_unlimited then
     if daily_limit is null or daily_limit < 0 then continue; end if;
     select count(*) into used_today from public.quote_notifications n
     where n.business_id=candidate.business_id and n.deleted_at is null
       and n.created_at>=date_trunc('day',now());
     if used_today >= daily_limit then continue; end if;
   end if;

   insert into public.quote_notifications(quote_request_id,business_id,sent_at,status,dispatch_order,distance_meters,expires_at)
   values(target_request_id,candidate.business_id,now(),'pending',
     coalesce((select max(dispatch_order) from public.quote_notifications
       where quote_request_id=target_request_id),0)+1,
     candidate.distance_meters,coalesce(request_row.expires_at,now()+interval '7 minutes'))
   returning * into promoted;
   return promoted;
 end loop;
 return null;
end;
$function$;

commit;
