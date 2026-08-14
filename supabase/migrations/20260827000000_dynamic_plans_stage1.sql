begin;

alter table public.saas_plans
  drop constraint if exists saas_plans_code_check;

alter table public.saas_plans
  add column if not exists is_unlimited boolean not null default false,
  add column if not exists is_public boolean not null default true,
  add column if not exists is_default_free boolean not null default false,
  add column if not exists sort_order integer not null default 0,
  add column if not exists benefits jsonb not null default '[]'::jsonb,
  add column if not exists provider_checkout_id text,
  add column if not exists provider_checkout_url text;

update public.saas_plans
set
  daily_quote_limit = 5,
  is_unlimited = false,
  is_public = true,
  is_default_free = true,
  sort_order = 0
where code = 'free';

update public.saas_plans
set
  is_unlimited = true,
  is_public = true,
  is_default_free = false,
  sort_order = 10
where code = 'premium';

create unique index if not exists saas_one_default_free_plan_idx
  on public.saas_plans (is_default_free)
  where is_default_free = true;

commit;
