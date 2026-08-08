alter table public.businesses
  add column if not exists location_accuracy numeric(10, 2),
  add column if not exists location_captured_at timestamptz;

alter table public.businesses
  drop constraint if exists businesses_location_accuracy_nonnegative;

alter table public.businesses
  add constraint businesses_location_accuracy_nonnegative
  check (location_accuracy is null or location_accuracy >= 0);
