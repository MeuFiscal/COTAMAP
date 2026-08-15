begin;

-- Hierarquia aprovada em 2026-08-14. Os UUIDs são os identificadores imutáveis
-- dos registros existentes; nome, preço e code não participam da regra.
do $$
begin
  update public.saas_plans set sort_order = 0, updated_at = now()
  where id = 'b697f150-e736-45f9-9f59-2e2d2b32429a'::uuid;
  if not found then raise exception 'approved_free_plan_not_found'; end if;

  update public.saas_plans set sort_order = 10, updated_at = now()
  where id = '296e56f4-e77b-4fd9-83b5-2a87df701ee7'::uuid;
  if not found then raise exception 'approved_test_plan_not_found'; end if;

  update public.saas_plans set sort_order = 20, updated_at = now()
  where id = 'b8b47bf0-0347-4238-8aa4-cd0ad6e44d41'::uuid;
  if not found then raise exception 'approved_premium_plan_not_found'; end if;
end;
$$;

alter table public.business_subscriptions
  add column if not exists provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_order_id text,
  add column if not exists provider_product_id text,
  add column if not exists provider_offer_id text,
  add column if not exists provider_status text,
  add column if not exists provider_event_at timestamptz,
  add column if not exists cancellation_requested_at timestamptz;

grant select, insert, update, delete
on table public.business_subscriptions
to service_role;

create table if not exists public.business_provider_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.saas_plans(id),
  provider text not null,
  provider_subscription_id text not null,
  provider_order_id text,
  provider_product_id text not null,
  provider_offer_id text not null,
  provider_status text not null,
  provider_event_at timestamptz,
  is_current boolean not null default false,
  was_activated boolean not null default false,
  cancellation_status text not null default 'not_requested'
    check (cancellation_status in ('not_requested','pending','processing','sent','canceled','failed')),
  cancellation_attempts integer not null default 0 check (cancellation_attempts >= 0),
  cancellation_requested_at timestamptz,
  cancellation_last_attempt_at timestamptz,
  cancellation_sent_at timestamptz,
  cancellation_completed_at timestamptz,
  cancellation_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

alter table public.business_provider_subscriptions
  add column if not exists was_activated boolean not null default false,
  add column if not exists cancellation_sent_at timestamptz;

create unique index if not exists business_provider_subscriptions_one_current_idx
  on public.business_provider_subscriptions (business_id)
  where is_current;

create index if not exists business_provider_subscriptions_pending_cancel_idx
  on public.business_provider_subscriptions (cancellation_status, cancellation_last_attempt_at, cancellation_requested_at)
where cancellation_status in ('pending','processing','failed');

alter table public.business_provider_subscriptions
  drop constraint if exists business_provider_subscriptions_cancellation_status_check;
alter table public.business_provider_subscriptions
  add constraint business_provider_subscriptions_cancellation_status_check
  check (cancellation_status in ('not_requested','pending','processing','sent','canceled','failed'));

create unique index if not exists saas_plans_provider_offer_unique_idx
  on public.saas_plans (provider, provider_product_id, provider_offer_id)
  where provider is not null and provider_product_id is not null and provider_offer_id is not null;

alter table public.business_provider_subscriptions enable row level security;
revoke all on table public.business_provider_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on table public.business_provider_subscriptions to service_role;

create table if not exists public.payment_webhook_events (
  event_id text primary key,
  provider text not null,
  event_name text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.payment_webhook_events
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists processing_status text not null default 'pending',
  add column if not exists attempts integer not null default 0,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists last_error text,
  add column if not exists result jsonb,
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists plan_id uuid references public.saas_plans(id) on delete set null,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_order_id text;

update public.payment_webhook_events
set id = gen_random_uuid()
where id is null;

update public.payment_webhook_events
set processing_status = 'completed',
    attempts = greatest(attempts, 1),
    completed_at = coalesce(completed_at, processed_at),
    result = coalesce(result, jsonb_build_object('result','legacy_processed'))
where processing_status = 'pending' and started_at is null;

alter table public.payment_webhook_events alter column id set not null;
alter table public.payment_webhook_events drop constraint if exists payment_webhook_events_pkey;
alter table public.payment_webhook_events add constraint payment_webhook_events_pkey primary key (id);
alter table public.payment_webhook_events drop constraint if exists payment_webhook_events_processing_status_check;
alter table public.payment_webhook_events add constraint payment_webhook_events_processing_status_check
  check (processing_status in ('pending','processing','completed','failed'));
alter table public.payment_webhook_events drop constraint if exists payment_webhook_events_attempts_check;
alter table public.payment_webhook_events add constraint payment_webhook_events_attempts_check check (attempts >= 0);
alter table public.payment_webhook_events drop constraint if exists payment_webhook_events_provider_event_key;
alter table public.payment_webhook_events add constraint payment_webhook_events_provider_event_key
  unique (provider, event_name, event_id);

alter table public.payment_webhook_events enable row level security;
revoke all on table public.payment_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.payment_webhook_events to service_role;

create or replace function public.claim_payment_webhook_event(
  p_provider text,
  p_event_name text,
  p_event_id text,
  p_payload jsonb,
  p_provider_subscription_id text default null,
  p_provider_order_id text default null
)
returns table (ledger_id uuid, claimed boolean, attempt integer)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  insert into public.payment_webhook_events (
    provider, event_name, event_id, payload, processing_status, attempts,
    started_at, processed_at, provider_subscription_id, provider_order_id
  ) values (
    p_provider, p_event_name, p_event_id, p_payload, 'processing', 1,
    now(), now(), nullif(p_provider_subscription_id, ''), nullif(p_provider_order_id, '')
  )
  on conflict (provider, event_name, event_id) do update
  set payload = excluded.payload,
      processing_status = 'processing',
      attempts = public.payment_webhook_events.attempts + 1,
      started_at = now(),
      completed_at = null,
      last_error = null,
      provider_subscription_id = coalesce(excluded.provider_subscription_id, public.payment_webhook_events.provider_subscription_id),
      provider_order_id = coalesce(excluded.provider_order_id, public.payment_webhook_events.provider_order_id)
  where public.payment_webhook_events.processing_status in ('pending','failed')
     or (public.payment_webhook_events.processing_status = 'processing'
         and public.payment_webhook_events.started_at < now() - interval '5 minutes')
  returning public.payment_webhook_events.id, true, public.payment_webhook_events.attempts;

  if not found then
    return query
    select e.id, false, e.attempts
    from public.payment_webhook_events e
    where e.provider = p_provider and e.event_name = p_event_name and e.event_id = p_event_id;
  end if;
end;
$$;

create or replace function public.finish_payment_webhook_event(
  p_ledger_id uuid,
  p_status text,
  p_result jsonb default null,
  p_error text default null,
  p_business_id uuid default null,
  p_plan_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_status not in ('completed','failed') then raise exception 'invalid_processing_status'; end if;
  update public.payment_webhook_events
  set processing_status = p_status,
      result = p_result,
      last_error = case when p_status = 'failed' then left(coalesce(p_error, 'processing_failed'), 500) else null end,
      business_id = coalesce(p_business_id, business_id),
      plan_id = coalesce(p_plan_id, plan_id),
      completed_at = now(),
      processed_at = now()
  where id = p_ledger_id;
end;
$$;

create or replace function public.record_provider_subscription(
  p_business_id uuid,
  p_plan_id uuid,
  p_provider text,
  p_subscription_id text,
  p_order_id text,
  p_product_id text,
  p_offer_id text,
  p_provider_status text,
  p_event_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  existing public.business_provider_subscriptions;
begin
  if nullif(p_subscription_id, '') is null then return jsonb_build_object('result','missing_subscription_id'); end if;
  select * into existing from public.business_provider_subscriptions
  where provider = p_provider and provider_subscription_id = p_subscription_id for update;

  if existing.id is not null and (existing.business_id <> p_business_id or existing.plan_id <> p_plan_id) then
    return jsonb_build_object('result','subscription_correlation_conflict');
  end if;

  insert into public.business_provider_subscriptions (
    business_id, plan_id, provider, provider_subscription_id, provider_order_id,
    provider_product_id, provider_offer_id, provider_status, provider_event_at
  ) values (
    p_business_id, p_plan_id, p_provider, p_subscription_id, nullif(p_order_id,''),
    p_product_id, p_offer_id, p_provider_status, p_event_at
  ) on conflict (provider, provider_subscription_id) do update
  set provider_order_id = coalesce(excluded.provider_order_id, public.business_provider_subscriptions.provider_order_id),
      provider_status = excluded.provider_status,
      provider_event_at = greatest(public.business_provider_subscriptions.provider_event_at, excluded.provider_event_at),
      updated_at = now();

  return jsonb_build_object('result','recorded');
end;
$$;

create or replace function public.activate_provider_subscription(
  p_business_id uuid,
  p_plan_id uuid,
  p_provider text,
  p_subscription_id text,
  p_order_id text,
  p_product_id text,
  p_offer_id text,
  p_provider_status text,
  p_event_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_row public.business_subscriptions;
  existing_history public.business_provider_subscriptions;
  previous_subscription_id text;
  activated timestamptz := now();
begin
  if nullif(p_subscription_id, '') is null then return jsonb_build_object('result','missing_subscription_id'); end if;
  perform pg_advisory_xact_lock(hashtextextended(p_business_id::text, 0));

  select * into current_row from public.business_subscriptions
  where business_id = p_business_id for update;
  select * into existing_history from public.business_provider_subscriptions
  where provider = p_provider and provider_subscription_id = p_subscription_id for update;

  if existing_history.id is not null
     and (existing_history.business_id <> p_business_id or existing_history.plan_id <> p_plan_id) then
    return jsonb_build_object('result','subscription_correlation_conflict');
  end if;

  if existing_history.id is not null and existing_history.was_activated and not existing_history.is_current
     and current_row.provider_subscription_id is not null
     and current_row.provider_subscription_id <> p_subscription_id then
    return jsonb_build_object('result','ignored_stale_subscription');
  end if;

  if current_row.provider_subscription_id is not null
     and current_row.provider_subscription_id <> p_subscription_id
     and current_row.provider_event_at is not null
     and p_event_at <= current_row.provider_event_at then
    return jsonb_build_object('result','ignored_stale_event');
  end if;

  previous_subscription_id := current_row.provider_subscription_id;
  if current_row.plan_id = p_plan_id and current_row.provider_subscription_id = p_subscription_id then
    activated := current_row.activated_at;
  end if;

  insert into public.business_provider_subscriptions (
    business_id, plan_id, provider, provider_subscription_id, provider_order_id,
    provider_product_id, provider_offer_id, provider_status, provider_event_at, is_current, was_activated
  ) values (
    p_business_id, p_plan_id, p_provider, p_subscription_id, nullif(p_order_id,''),
    p_product_id, p_offer_id, p_provider_status, p_event_at, false, true
  ) on conflict (provider, provider_subscription_id) do update
  set provider_order_id = coalesce(excluded.provider_order_id, public.business_provider_subscriptions.provider_order_id),
      provider_status = excluded.provider_status,
      provider_event_at = greatest(public.business_provider_subscriptions.provider_event_at, excluded.provider_event_at),
      was_activated = true,
      updated_at = now();

  if previous_subscription_id is not null and previous_subscription_id <> p_subscription_id then
    update public.business_provider_subscriptions
    set is_current = false,
        cancellation_status = case when cancellation_status = 'canceled' then cancellation_status else 'pending' end,
        cancellation_requested_at = coalesce(cancellation_requested_at, now()),
        cancellation_error = null,
        updated_at = now()
    where provider = current_row.provider
      and provider_subscription_id = previous_subscription_id;
  end if;

  update public.business_provider_subscriptions
  set is_current = false, updated_at = now()
  where business_id = p_business_id and is_current and provider_subscription_id <> p_subscription_id;

  update public.business_provider_subscriptions
  set is_current = true,
      was_activated = true,
      provider_status = p_provider_status,
      provider_event_at = greatest(provider_event_at, p_event_at),
      updated_at = now()
  where provider = p_provider and provider_subscription_id = p_subscription_id;

  insert into public.business_subscriptions (
    business_id, plan_id, status, activated_at, changed_at, provider,
    provider_subscription_id, provider_order_id, provider_product_id,
    provider_offer_id, provider_status, provider_event_at, cancellation_requested_at
  ) values (
    p_business_id, p_plan_id, 'active', activated, now(), p_provider,
    p_subscription_id, nullif(p_order_id,''), p_product_id,
    p_offer_id, p_provider_status, p_event_at, null
  ) on conflict (business_id) do update
  set plan_id = excluded.plan_id,
      status = 'active',
      activated_at = excluded.activated_at,
      changed_at = now(),
      provider = excluded.provider,
      provider_subscription_id = excluded.provider_subscription_id,
      provider_order_id = excluded.provider_order_id,
      provider_product_id = excluded.provider_product_id,
      provider_offer_id = excluded.provider_offer_id,
      provider_status = excluded.provider_status,
      provider_event_at = excluded.provider_event_at,
      cancellation_requested_at = null;

  return jsonb_build_object(
    'result','activated',
    'previous_subscription_id',previous_subscription_id,
    'previous_cancellation_pending',previous_subscription_id is not null and previous_subscription_id <> p_subscription_id
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
  is_revocation boolean := p_event_name in ('subscription_canceled','subscription_cancelled','refund','chargeback');
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
  set provider_status = p_provider_status,
      provider_event_at = p_event_at,
      cancellation_status = case when p_event_name in ('subscription_canceled','subscription_cancelled') then 'canceled' else cancellation_status end,
      cancellation_completed_at = case when p_event_name in ('subscription_canceled','subscription_cancelled') then now() else cancellation_completed_at end,
      cancellation_error = case when p_event_name in ('subscription_canceled','subscription_cancelled') then null else cancellation_error end,
      updated_at = now()
  where id = history.id;

  select * into current_row from public.business_subscriptions
  where business_id = history.business_id for update;
  if not history.is_current or current_row.provider_subscription_id is distinct from history.provider_subscription_id then
    return jsonb_build_object('result','recorded_stale_subscription');
  end if;

  if not is_revocation then
    update public.business_subscriptions
    set provider_status = p_provider_status, provider_event_at = p_event_at, changed_at = now()
    where business_id = history.business_id;
    return jsonb_build_object('result',case when p_event_name = 'subscription_renewal_refused' then 'renewal_refused_recorded' else 'renewed' end);
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
      cancellation_requested_at = null
  where business_id = history.business_id;

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
  if current_row.provider <> 'cakto' or current_row.provider_subscription_id is distinct from p_subscription_id then
    return jsonb_build_object('result','subscription_not_cancelable');
  end if;

  update public.business_provider_subscriptions
  set cancellation_status = 'pending',
      cancellation_requested_at = coalesce(cancellation_requested_at, now()),
      cancellation_error = null,
      updated_at = now()
  where provider = current_row.provider and provider_subscription_id = p_subscription_id and is_current;

  update public.business_subscriptions
  set cancellation_requested_at = coalesce(cancellation_requested_at, now()), changed_at = now()
  where business_id = p_business_id;
  return jsonb_build_object('result','cancellation_requested');
end;
$$;

create or replace function public.increment_provider_cancellation_attempt(
  p_provider text,
  p_subscription_id text
)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.business_provider_subscriptions
  set cancellation_attempts = cancellation_attempts + 1,
      cancellation_last_attempt_at = now(),
      updated_at = now()
  where provider = p_provider and provider_subscription_id = p_subscription_id;
$$;

create or replace function public.claim_pending_provider_cancellations(p_limit integer default 10)
returns table (provider_subscription_id text)
language sql
security invoker
set search_path = public
as $$
  with candidates as (
    select id
    from public.business_provider_subscriptions
    where provider = 'cakto'
      and (
        cancellation_status in ('pending','failed')
        or (cancellation_status = 'processing'
            and cancellation_last_attempt_at < now() - interval '30 minutes')
      )
      and cancellation_attempts < 8
      and (
        cancellation_attempts = 0
        or cancellation_last_attempt_at is null
        or cancellation_last_attempt_at <= now() - make_interval(mins => case
          when cancellation_attempts = 1 then 15
          when cancellation_attempts = 2 then 30
          when cancellation_attempts = 3 then 60
          when cancellation_attempts = 4 then 120
          when cancellation_attempts = 5 then 240
          else 480
        end)
      )
    order by cancellation_requested_at nulls last, created_at
    for update skip locked
    limit greatest(1, least(p_limit, 25))
  )
  update public.business_provider_subscriptions target
  set cancellation_status = 'processing',
      cancellation_attempts = target.cancellation_attempts + 1,
      cancellation_last_attempt_at = now(),
      cancellation_error = null,
      updated_at = now()
  from candidates
  where target.id = candidates.id
  returning target.provider_subscription_id;
$$;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.invoke_cakto_subscription_retry()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  function_url text;
  retry_secret text;
begin
  select decrypted_secret into function_url
  from vault.decrypted_secrets where name = 'cakto_retry_function_url' limit 1;
  select decrypted_secret into retry_secret
  from vault.decrypted_secrets where name = 'cakto_retry_secret' limit 1;

  -- Antes da Function e dos dois secrets serem aprovados, o Cron é um no-op seguro.
  if nullif(function_url, '') is null or nullif(retry_secret, '') is null then return; end if;

  perform net.http_post(
    url => function_url,
    headers => jsonb_build_object(
      'Content-Type', 'application/json',
      'X-CotaMap-Retry-Secret', retry_secret
    ),
    body => jsonb_build_object('action', 'retry_pending'),
    timeout_milliseconds => 5000
  );
end;
$$;

revoke all on function private.invoke_cakto_subscription_retry() from public, anon, authenticated, service_role;
grant execute on function private.invoke_cakto_subscription_retry() to postgres;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'cakto-subscription-retry') then
    perform cron.unschedule('cakto-subscription-retry');
  end if;
  perform cron.schedule(
    'cakto-subscription-retry',
    '*/15 * * * *',
    'select private.invoke_cakto_subscription_retry()'
  );
end;
$$;

revoke all on function public.claim_payment_webhook_event(text,text,text,jsonb,text,text) from public, anon, authenticated;
revoke all on function public.finish_payment_webhook_event(uuid,text,jsonb,text,uuid,uuid) from public, anon, authenticated;
revoke all on function public.record_provider_subscription(uuid,uuid,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.activate_provider_subscription(uuid,uuid,text,text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.apply_provider_subscription_event(text,text,text,text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.request_provider_subscription_cancellation(uuid,text) from public, anon, authenticated;
revoke all on function public.increment_provider_cancellation_attempt(text,text) from public, anon, authenticated;
revoke all on function public.claim_pending_provider_cancellations(integer) from public, anon, authenticated;
grant execute on function public.claim_payment_webhook_event(text,text,text,jsonb,text,text) to service_role;
grant execute on function public.finish_payment_webhook_event(uuid,text,jsonb,text,uuid,uuid) to service_role;
grant execute on function public.record_provider_subscription(uuid,uuid,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.activate_provider_subscription(uuid,uuid,text,text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.apply_provider_subscription_event(text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.request_provider_subscription_cancellation(uuid,text) to service_role;
grant execute on function public.increment_provider_cancellation_attempt(text,text) to service_role;
grant execute on function public.claim_pending_provider_cancellations(integer) to service_role;

-- Rollback lógico documentado (não executar automaticamente):
-- 1. select cron.unschedule('cakto-subscription-retry');
-- 2. drop function private.invoke_cakto_subscription_retry();
-- 3. revogar/remover as RPCs públicas desta migration.
-- 4. exportar business_provider_subscriptions antes de remover tabela/colunas.
-- 5. restaurar os sort_order anteriores somente por nova migration aprovada.
-- pg_cron e pg_net não devem ser removidos sem auditar outros consumidores.

commit;
