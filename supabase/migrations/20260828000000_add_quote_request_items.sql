begin;

-- Normalized line items. Existing requests remain valid and are read through
-- their legacy part_name when no rows exist here.
create table if not exists public.quote_request_items (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on update cascade on delete restrict,
  position smallint not null default 0,
  name text not null,
  brand text,
  quantity numeric(12,3) not null default 1,
  unit text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_request_items_name_not_blank check (btrim(name) <> ''),
  constraint quote_request_items_position_valid check (position between 0 and 9),
  constraint quote_request_items_quantity_positive check (quantity > 0),
  constraint quote_request_items_unique_position unique (quote_request_id, position)
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on update cascade on delete restrict,
  quote_request_item_id uuid not null references public.quote_request_items(id) on update cascade on delete restrict,
  available boolean not null default true,
  unit_price numeric(14,2) not null default 0,
  quantity_available numeric(12,3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quotation_items_price_nonnegative check (unit_price >= 0),
  constraint quotation_items_quantity_valid check (quantity_available is null or quantity_available > 0),
  constraint quotation_items_unique_line unique (quotation_id, quote_request_item_id)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on update cascade on delete restrict,
  quotation_item_id uuid references public.quotation_items(id) on update cascade on delete restrict,
  name text not null,
  quantity numeric(12,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  subtotal numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint order_items_name_not_blank check (btrim(name) <> ''),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_price_nonnegative check (unit_price >= 0),
  constraint order_items_subtotal_nonnegative check (subtotal >= 0),
  constraint order_items_unique_quotation_item unique (order_id, quotation_item_id)
);

create index if not exists quote_request_items_request_position_idx on public.quote_request_items (quote_request_id, position);
create index if not exists quotation_items_quotation_idx on public.quotation_items (quotation_id);
create index if not exists quotation_items_request_item_idx on public.quotation_items (quote_request_item_id);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function private.ensure_quotation_item_request_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare quotation_request_id uuid; item_request_id uuid;
begin
  select quote_request_id into quotation_request_id from public.quotations where id = new.quotation_id;
  select quote_request_id into item_request_id from public.quote_request_items where id = new.quote_request_item_id;
  if quotation_request_id is null or item_request_id is null or quotation_request_id <> item_request_id then
    raise exception 'quotation_item_request_mismatch';
  end if;
  return new;
end;
$$;

drop trigger if exists quotation_items_request_match on public.quotation_items;
create trigger quotation_items_request_match before insert or update on public.quotation_items
for each row execute function private.ensure_quotation_item_request_match();

alter table public.quote_request_items enable row level security;
alter table public.quotation_items enable row level security;
alter table public.order_items enable row level security;

drop policy if exists quote_request_items_select_authorized on public.quote_request_items;
create policy quote_request_items_select_authorized on public.quote_request_items for select to authenticated using (
  exists (select 1 from public.quote_requests r where r.id = quote_request_id and r.deleted_at is null and (
    r.customer_id = (select auth.uid()) or (select private.can_access_quote_request(r.id)) or (select private.is_admin())
  ))
);
drop policy if exists quotation_items_select_authorized on public.quotation_items;
create policy quotation_items_select_authorized on public.quotation_items for select to authenticated using (
  exists (select 1 from public.quotations q where q.id = quotation_id and q.deleted_at is null and (
    (select private.can_view_quotation(q.id)) or (select private.is_admin())
  ))
);
drop policy if exists order_items_select_authorized on public.order_items;
create policy order_items_select_authorized on public.order_items for select to authenticated using (
  exists (select 1 from public.orders o join public.quotations q on q.id = o.quotation_id where o.id = order_id and q.deleted_at is null and (
    (select private.can_view_quotation(q.id)) or (select private.is_admin())
  ))
);

grant select on public.quote_request_items, public.quotation_items, public.order_items to authenticated;
grant select, insert, update, delete on public.quote_request_items, public.quotation_items, public.order_items to service_role;
revoke insert, update, delete on public.quote_request_items, public.quotation_items, public.order_items from anon, authenticated;

alter table public.quote_request_items replica identity full;
alter table public.quotation_items replica identity full;
alter table public.order_items replica identity full;
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='quote_request_items') then alter publication supabase_realtime add table public.quote_request_items; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='quotation_items') then alter publication supabase_realtime add table public.quotation_items; end if;
end $$;

-- Item-aware response path. The legacy responder_cotacao remains untouched.
create or replace function public.responder_cotacao_com_itens(
  target_notification_id uuid, target_actor_profile_id uuid, target_action text,
  target_items jsonb default '[]'::jsonb, target_notes text default null,
  target_response_time_seconds integer default null
)
returns public.quotations
language plpgsql security definer set search_path = public
as $$
declare n public.quote_notifications; r public.quote_requests; q public.quotations; item jsonb; item_row public.quote_request_items; line_total numeric := 0; available_count integer := 0; item_count integer := 0; qty numeric; price numeric;
begin
  if target_action not in ('accept','reject') then raise exception 'invalid_action'; end if;
  select * into n from public.quote_notifications where id=target_notification_id and deleted_at is null for update;
  if n.id is null then raise exception 'notification_not_found'; end if;
  if not exists (select 1 from public.business_employees e where e.business_id=n.business_id and e.profile_id=target_actor_profile_id and e.role in ('owner','manager','employee') and e.is_active and e.deleted_at is null) then raise exception 'business_member_not_authorized'; end if;
  if n.status not in ('pending','sent') then raise exception 'notification_not_active'; end if;
  select * into r from public.quote_requests where id=n.quote_request_id and deleted_at is null for update;
  if r.id is null or r.status <> 'waiting' or coalesce(r.expires_at,now()) <= now() then raise exception 'request_expired'; end if;
  if target_action='reject' then
    update public.quote_notifications set status='rejected', responded_at=now(), updated_at=now() where id=n.id;
    perform public.promover_proxima_empresa(r.id); return null;
  end if;
  if jsonb_typeof(target_items) <> 'array' or jsonb_array_length(target_items) < 1 or jsonb_array_length(target_items) > 10 then raise exception 'invalid_items'; end if;
  for item in select value from jsonb_array_elements(target_items) loop
    item_count := item_count + 1;
    select * into item_row from public.quote_request_items where id=(item->>'quote_request_item_id')::uuid and quote_request_id=r.id;
    if item_row.id is null then raise exception 'quote_request_item_not_found'; end if;
    if coalesce((item->>'available')::boolean, false) then
      price := coalesce((item->>'unit_price')::numeric, -1); qty := coalesce((item->>'quantity')::numeric, item_row.quantity);
      if price < 0 or qty <= 0 then raise exception 'invalid_item_price_or_quantity'; end if;
      line_total := line_total + price * qty; available_count := available_count + 1;
    end if;
  end loop;
  if available_count = 0 then raise exception 'at_least_one_item_available'; end if;
  insert into public.quotations (quote_request_id,business_id,submitted_by_profile_id,amount,notes,status,response_time_seconds,expires_at)
  values (r.id,n.business_id,target_actor_profile_id,round(line_total,2),target_notes,'sent',target_response_time_seconds,r.expires_at) returning * into q;
  for item in select value from jsonb_array_elements(target_items) loop
    select * into item_row from public.quote_request_items where id=(item->>'quote_request_item_id')::uuid;
    insert into public.quotation_items (quotation_id,quote_request_item_id,available,unit_price,quantity_available,notes)
    values (q.id,item_row.id,coalesce((item->>'available')::boolean,false),coalesce((item->>'unit_price')::numeric,0),nullif((item->>'quantity')::numeric,0),item->>'notes');
  end loop;
  update public.quote_notifications set status='responded',responded_at=now(),updated_at=now() where id=n.id;
  return q;
end;
$$;
revoke all on function public.responder_cotacao_com_itens(uuid,uuid,text,jsonb,text,integer) from public, anon, authenticated;
grant execute on function public.responder_cotacao_com_itens(uuid,uuid,text,jsonb,text,integer) to service_role;

create or replace function public.escolher_cotacao(target_quotation_id uuid, target_customer_id uuid)
returns public.orders language plpgsql security definer set search_path = public
as $$
declare selected public.quotations; request_row public.quote_requests; created_order public.orders; line public.quotation_items; requested public.quote_request_items; qty numeric;
begin
  select * into selected from public.quotations where id=target_quotation_id and deleted_at is null for update;
  if selected.id is null then raise exception 'quotation_not_found'; end if;
  select * into request_row from public.quote_requests where id=selected.quote_request_id and deleted_at is null for update;
  if request_row.id is null or request_row.customer_id <> target_customer_id then raise exception 'not_request_owner'; end if;
  if request_row.status <> 'waiting' or coalesce(request_row.expires_at,now()) <= now() then raise exception 'request_expired'; end if;
  if selected.status not in ('sent','pending') then raise exception 'quotation_unavailable'; end if;
  if exists (select 1 from public.orders o join public.quotations q on q.id=o.quotation_id where q.quote_request_id=request_row.id and o.deleted_at is null) then raise exception 'order_already_exists'; end if;
  insert into public.orders (quotation_id,status) values (selected.id,'pending') returning * into created_order;
  for line in select qi.* from public.quotation_items qi where qi.quotation_id=selected.id and qi.available loop
    select * into requested from public.quote_request_items where id=line.quote_request_item_id;
    qty := coalesce(line.quantity_available, requested.quantity);
    insert into public.order_items(order_id,quotation_item_id,name,quantity,unit_price,subtotal) values (created_order.id,line.id,requested.name,qty,line.unit_price,round(qty*line.unit_price,2));
  end loop;
  if not exists (select 1 from public.order_items where order_id=created_order.id) then
    insert into public.order_items(order_id,name,quantity,unit_price,subtotal) values (created_order.id,coalesce(request_row.part_name,'Peça solicitada'),1,selected.amount,selected.amount);
  end if;
  update public.quotations set status='accepted',updated_at=now() where id=selected.id;
  update public.quotations set status='rejected',updated_at=now() where quote_request_id=request_row.id and id<>selected.id and deleted_at is null and status in ('sent','pending');
  update public.quote_requests set status='accepted',updated_at=now() where id=request_row.id;
  update public.quote_notifications set status='cancelled',updated_at=now() where quote_request_id=request_row.id and deleted_at is null and status in ('pending','sent');
  insert into public.audit_logs(actor_profile_id,entity_type,entity_id,action,metadata) values (target_customer_id,'order',created_order.id,'quotation_chosen',jsonb_build_object('quotation_id',selected.id,'business_id',selected.business_id,'quote_request_id',request_row.id));
  return created_order;
exception when unique_violation then raise exception 'order_already_exists'; end;
$$;
revoke all on function public.escolher_cotacao(uuid,uuid) from public,anon,authenticated;
grant execute on function public.escolher_cotacao(uuid,uuid) to service_role;

commit;
