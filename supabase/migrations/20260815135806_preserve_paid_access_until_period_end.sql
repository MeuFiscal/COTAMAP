begin;

alter table public.business_subscriptions
  add column if not exists current_period_end timestamptz;

alter table public.business_provider_subscriptions
  add column if not exists current_period_end timestamptz,
  add column if not exists expired_at timestamptz;

create index if not exists business_provider_subscriptions_due_expiration_idx
  on public.business_provider_subscriptions (current_period_end, business_id)
  where is_current
    and current_period_end is not null
    and (cancellation_status = 'canceled' or provider_status = 'renewal_refused');

-- Backfill controlado da primeira assinatura real. A identidade externa, e não
-- nome/preço/plano, é a autoridade. A migration falha se ela não for a atual exata.
do $$
declare
  target_subscription_id constant text := '8de786d0-8956-4246-8c1b-5b40ffb99622';
  official_period_end constant timestamptz := '2026-09-14T10:29:46.071638-03:00'::timestamptz;
  target_history public.business_provider_subscriptions;
begin
  select history.* into target_history
  from public.business_provider_subscriptions history
  join public.business_subscriptions current_subscription
    on current_subscription.business_id = history.business_id
   and current_subscription.provider = history.provider
   and current_subscription.provider_subscription_id = history.provider_subscription_id
  where history.provider = 'cakto'
    and history.provider_subscription_id = target_subscription_id
    and history.is_current
    and history.was_activated
  for update of history;

  if target_history.id is null then
    raise exception 'approved_current_subscription_not_found';
  end if;

  update public.business_provider_subscriptions
  set current_period_end = official_period_end,
      updated_at = now()
  where id = target_history.id;

  update public.business_subscriptions
  set current_period_end = official_period_end,
      changed_at = now()
  where business_id = target_history.business_id
    and provider = target_history.provider
    and provider_subscription_id = target_history.provider_subscription_id;

  if not found then
    raise exception 'approved_current_subscription_changed';
  end if;
end;
$$;

create or replace function public.set_provider_subscription_period(
  p_provider text,
  p_subscription_id text,
  p_current_period_end timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  history public.business_provider_subscriptions;
  effective_period_end timestamptz;
begin
  if nullif(p_provider, '') is null
     or nullif(p_subscription_id, '') is null then
    return jsonb_build_object('result', 'invalid_subscription_identity');
  end if;

  select * into history
  from public.business_provider_subscriptions
  where provider = p_provider
    and provider_subscription_id = p_subscription_id
  for update;

  if history.id is null then
    return jsonb_build_object('result', 'subscription_not_found');
  end if;

  effective_period_end := greatest(history.current_period_end, p_current_period_end);
  if effective_period_end is null then
    return jsonb_build_object('result', 'period_end_unavailable');
  end if;

  update public.business_provider_subscriptions
  set current_period_end = effective_period_end,
      updated_at = now()
  where id = history.id;

  if history.is_current then
    update public.business_subscriptions
    set current_period_end = effective_period_end,
        changed_at = now()
    where business_id = history.business_id
      and provider = history.provider
      and provider_subscription_id = history.provider_subscription_id;

    if not found then
      return jsonb_build_object('result', 'recorded_stale_subscription');
    end if;
  end if;

  return jsonb_build_object(
    'result', case when history.is_current then 'current_period_updated' else 'history_period_updated' end,
    'current_period_end', effective_period_end
  );
end;
$$;

create or replace function public.apply_provider_subscription_event(
  p_provider text,
  p_subscription_id text,
  p_order_id text,
  p_event_name text,
  p_provider_status text,
  p_event_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  history public.business_provider_subscriptions;
  current_row public.business_subscriptions;
  free_plan_id uuid;
  match_count integer;
  is_cancellation boolean := p_event_name in ('subscription_canceled','subscription_cancelled');
  is_immediate_revocation boolean := p_event_name in ('refund','chargeback');
  normalized_status text := case
    when p_event_name in ('subscription_canceled','subscription_cancelled') then 'canceled'
    when p_event_name = 'subscription_renewal_refused' then 'renewal_refused'
    else p_provider_status
  end;
begin
  if nullif(p_subscription_id,'') is not null then
    select * into history from public.business_provider_subscriptions
    where provider = p_provider and provider_subscription_id = p_subscription_id for update;
  elsif nullif(p_order_id,'') is not null then
    select count(*) into match_count from public.business_provider_subscriptions
    where provider = p_provider and provider_order_id = p_order_id;
    if match_count <> 1 then return jsonb_build_object('result','unmatched_or_ambiguous_subscription'); end if;
    select * into history from public.business_provider_subscriptions
    where provider = p_provider and provider_order_id = p_order_id for update;
  else
    return jsonb_build_object('result','missing_subscription_correlation');
  end if;

  if history.id is null then return jsonb_build_object('result','subscription_not_found'); end if;
  if history.provider_event_at is not null and p_event_at < history.provider_event_at then
    return jsonb_build_object('result','ignored_stale_event');
  end if;

  update public.business_provider_subscriptions
  set provider_status = normalized_status,
      provider_event_at = p_event_at,
      cancellation_status = case when is_cancellation then 'canceled' else cancellation_status end,
      cancellation_completed_at = case when is_cancellation then now() else cancellation_completed_at end,
      cancellation_error = case when is_cancellation then null else cancellation_error end,
      updated_at = now()
  where id = history.id;

  select * into current_row from public.business_subscriptions
  where business_id = history.business_id for update;
  if not history.is_current or current_row.provider_subscription_id is distinct from history.provider_subscription_id then
    return jsonb_build_object('result','recorded_stale_subscription');
  end if;

  if is_cancellation then
    update public.business_subscriptions
    set provider_status = normalized_status,
        provider_event_at = p_event_at,
        cancellation_requested_at = coalesce(cancellation_requested_at, now()),
        current_period_end = coalesce(current_period_end, history.current_period_end),
        changed_at = now()
    where business_id = history.business_id
      and provider = history.provider
      and provider_subscription_id = history.provider_subscription_id;

    return jsonb_build_object(
      'result', case when coalesce(current_row.current_period_end, history.current_period_end) is null
        then 'cancellation_recorded_period_end_missing'
        else 'cancellation_recorded_access_preserved'
      end,
      'current_period_end', coalesce(current_row.current_period_end, history.current_period_end)
    );
  end if;

  if not is_immediate_revocation then
    update public.business_subscriptions
    set provider_status = normalized_status,
        provider_event_at = p_event_at,
        changed_at = now()
    where business_id = history.business_id;
    return jsonb_build_object(
      'result', case when p_event_name = 'subscription_renewal_refused'
        then 'renewal_refused_recorded'
        else 'renewed'
      end
    );
  end if;

  select count(*) into match_count
  from public.saas_plans where is_default_free and is_active;
  if match_count <> 1 then return jsonb_build_object('result','free_plan_configuration_error'); end if;
  select id into free_plan_id from public.saas_plans where is_default_free and is_active;

  update public.business_provider_subscriptions
  set is_current = false, updated_at = now()
  where id = history.id;

  update public.business_subscriptions
  set plan_id = free_plan_id,
      status = 'active',
      activated_at = now(),
      changed_at = now(),
      provider = null,
      provider_subscription_id = null,
      provider_order_id = null,
      provider_product_id = null,
      provider_offer_id = null,
      provider_status = null,
      provider_event_at = p_event_at,
      cancellation_requested_at = null,
      current_period_end = null
  where business_id = history.business_id
    and provider = history.provider
    and provider_subscription_id = history.provider_subscription_id;

  return jsonb_build_object('result','reverted_to_free');
end;
$$;

create or replace function public.request_provider_subscription_cancellation(
  p_business_id uuid,
  p_subscription_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.business_subscriptions;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 0));
  select * into current_row from public.business_subscriptions
  where business_id = p_business_id for update;

  if current_row.provider <> 'cakto'
     or current_row.provider_subscription_id is distinct from p_subscription_id then
    return jsonb_build_object('result','subscription_not_cancelable');
  end if;
  if current_row.current_period_end is null or current_row.current_period_end <= now() then
    return jsonb_build_object('result','current_period_end_required');
  end if;
  if current_row.cancellation_requested_at is not null then
    return jsonb_build_object('result','cancellation_already_requested');
  end if;

  update public.business_provider_subscriptions
  set cancellation_status = 'pending',
      cancellation_requested_at = coalesce(cancellation_requested_at, now()),
      cancellation_error = null,
      updated_at = now()
  where provider = current_row.provider
    and provider_subscription_id = p_subscription_id
    and is_current
    and current_period_end = current_row.current_period_end;

  if not found then
    return jsonb_build_object('result','subscription_not_cancelable');
  end if;

  update public.business_subscriptions
  set cancellation_requested_at = coalesce(cancellation_requested_at, now()), changed_at = now()
  where business_id = p_business_id
    and provider_subscription_id = p_subscription_id;

  return jsonb_build_object(
    'result','cancellation_requested',
    'current_period_end',current_row.current_period_end
  );
end;
$$;

create or replace function public.expire_due_provider_subscriptions(p_limit integer default 100)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  candidate record;
  history public.business_provider_subscriptions;
  current_row public.business_subscriptions;
  free_plan_id uuid;
  free_plan_count integer;
  expired_count integer := 0;
  skipped_count integer := 0;
begin
  select count(*) into free_plan_count
  from public.saas_plans
  where is_default_free and is_active;
  if free_plan_count <> 1 then
    return jsonb_build_object('result','free_plan_configuration_error');
  end if;
  select id into free_plan_id
  from public.saas_plans
  where is_default_free and is_active;

  for candidate in
    select due.id, due.business_id
    from public.business_provider_subscriptions due
    where due.is_current
      and due.was_activated
      and due.current_period_end is not null
      and due.current_period_end <= now()
      and (
        due.cancellation_status = 'canceled'
        or due.provider_status = 'renewal_refused'
      )
    order by due.current_period_end, due.created_at
    limit greatest(1, least(p_limit, 500))
  loop
    perform pg_advisory_xact_lock(hashtextextended(candidate.business_id::text, 0));
    history := null;
    select * into history
    from public.business_provider_subscriptions
    where id = candidate.id
    for update;

    if history.id is null
       or not history.is_current
       or not history.was_activated
       or history.current_period_end is null
       or history.current_period_end > now()
       or (history.cancellation_status <> 'canceled' and history.provider_status <> 'renewal_refused') then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    current_row := null;
    select * into current_row
    from public.business_subscriptions
    where business_id = history.business_id
    for update;

    if current_row.provider is distinct from history.provider
       or current_row.provider_subscription_id is distinct from history.provider_subscription_id
       or current_row.current_period_end is distinct from history.current_period_end
       or current_row.current_period_end > now() then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    update public.business_provider_subscriptions
    set is_current = false,
        expired_at = coalesce(expired_at, now()),
        updated_at = now()
    where id = history.id
      and is_current
      and current_period_end = history.current_period_end;

    if not found then
      skipped_count := skipped_count + 1;
      continue;
    end if;

    update public.business_subscriptions
    set plan_id = free_plan_id,
        status = 'active',
        activated_at = now(),
        changed_at = now(),
        provider = null,
        provider_subscription_id = null,
        provider_order_id = null,
        provider_product_id = null,
        provider_offer_id = null,
        provider_status = null,
        provider_event_at = now(),
        cancellation_requested_at = null,
        current_period_end = null
    where business_id = history.business_id
      and provider = history.provider
      and provider_subscription_id = history.provider_subscription_id
      and current_period_end = history.current_period_end;

    if found then
      expired_count := expired_count + 1;
    else
      raise exception 'subscription_changed_during_expiration';
    end if;
  end loop;

  return jsonb_build_object('result','completed','expired',expired_count,'skipped',skipped_count);
end;
$$;

revoke all on function public.set_provider_subscription_period(text,text,timestamptz)
  from public, anon, authenticated;
revoke all on function public.expire_due_provider_subscriptions(integer)
  from public, anon, authenticated;
grant execute on function public.set_provider_subscription_period(text,text,timestamptz)
  to service_role;
grant execute on function public.expire_due_provider_subscriptions(integer)
  to service_role;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cakto-subscription-expiration') then
    perform cron.unschedule('cakto-subscription-expiration');
  end if;
  perform cron.schedule(
    'cakto-subscription-expiration',
    '17 * * * *',
    'select public.expire_due_provider_subscriptions(100)'
  );
end;
$$;

-- Rollback lógico documentado (não executar automaticamente):
-- 1. select cron.unschedule('cakto-subscription-expiration');
-- 2. restaurar as RPCs de lifecycle somente por nova migration aprovada;
-- 3. manter os campos e o histórico até confirmar que nenhum consumidor os usa;
-- 4. nunca apagar o backfill ou o histórico da assinatura real.

commit;
