begin;

-- The primary item is position 1. Normalize any legacy zero-based rows before
-- enforcing the one-based range used by the multi-item API.
alter table public.quote_request_items
  drop constraint if exists quote_request_items_position_valid,
  drop constraint if exists quote_request_items_unique_position;

update public.quote_request_items
set position = position + 1;

alter table public.quote_request_items
  alter column position set default 1,
  add constraint quote_request_items_position_valid check (position between 1 and 10),
  add constraint quote_request_items_unique_position unique (quote_request_id, position);

commit;
