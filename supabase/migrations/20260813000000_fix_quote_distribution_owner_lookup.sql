-- Keep quote distribution compatible with the current businesses schema.
create or replace function public.criar_notificacoes(target_request_id uuid)
returns setof public.quote_notifications
language plpgsql security definer
set search_path to 'public','extensions'
as $function$
declare request_row public.quote_requests; candidate record; next_order smallint:=1; settings public.distribution_settings; daily_limit integer; used_today integer; has_subscription boolean;
begin
 select * into request_row from public.quote_requests where id=target_request_id and deleted_at is null for update;
 if request_row.id is null then raise exception 'quote_request_not_found'; end if;
 if auth.role() <> 'service_role' and request_row.customer_id <> auth.uid() then raise exception 'not_authorized'; end if;
 select * into settings from public.distribution_settings where id=true;
 for candidate in select * from public.buscar_empresas_inteligente(request_row.latitude,request_row.longitude,request_row.business_category_id) limit coalesce(settings.initial_business_count,5) loop
  has_subscription:=false;
  select p.daily_quote_limit into daily_limit from public.business_subscriptions s join public.saas_plans p on p.id=s.plan_id where s.business_id=candidate.business_id and s.status='active' and p.is_active limit 1;
  if found then has_subscription:=true; else select p.daily_quote_limit into daily_limit from public.saas_plans p where p.code='free' and p.is_active order by p.created_at asc limit 1; end if;
  if not exists (select 1 from public.platform_admins a join public.business_employees e on e.business_id=candidate.business_id and e.role='owner' and e.is_active and e.deleted_at is null join auth.users u on u.id=e.profile_id where lower(a.email)=lower(u.email) and a.active) then
   select count(*) into used_today from public.quote_notifications n where n.business_id=candidate.business_id and n.deleted_at is null and n.created_at>=date_trunc('day',now());
   if daily_limit is null or used_today<daily_limit then insert into public.quote_notifications(quote_request_id,business_id,sent_at,status,dispatch_order,distance_meters,expires_at) values(target_request_id,candidate.business_id,now(),'pending',next_order,candidate.distance_meters,coalesce(request_row.expires_at,now()+interval '7 minutes')) on conflict (quote_request_id,business_id) where deleted_at is null do nothing; next_order:=next_order+1; end if;
  else
   insert into public.quote_notifications(quote_request_id,business_id,sent_at,status,dispatch_order,distance_meters,expires_at) values(target_request_id,candidate.business_id,now(),'pending',next_order,candidate.distance_meters,coalesce(request_row.expires_at,now()+interval '7 minutes')) on conflict (quote_request_id,business_id) where deleted_at is null do nothing; next_order:=next_order+1;
  end if;
 end loop;
 return query select n.* from public.quote_notifications n where n.quote_request_id=target_request_id and n.deleted_at is null order by n.dispatch_order;
end;$function$;