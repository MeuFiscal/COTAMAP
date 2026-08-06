begin;

create extension if not exists postgis;
create extension if not exists pgcrypto;

create type public.business_status as enum ('active', 'inactive', 'blocked');
create type public.user_role as enum ('owner', 'manager', 'employee', 'customer', 'admin');
create type public.quote_status as enum ('waiting', 'accepted', 'expired', 'cancelled', 'finished');
create type public.quotation_status as enum ('pending', 'sent', 'accepted', 'rejected', 'expired');
create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_full_name_not_blank check (btrim(full_name) <> ''),
  constraint profiles_email_not_blank check (btrim(email) <> '')
);

create table public.business_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint business_categories_name_not_blank check (btrim(name) <> ''),
  constraint business_categories_slug_not_blank check (btrim(slug) <> '')
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  business_category_id uuid,
  name text not null,
  legal_name text,
  description text,
  logo_url text,
  banner_url text,
  cover_url text,
  address_line text,
  address_number text,
  address_complement text,
  neighborhood text,
  postal_code text,
  city text,
  state text,
  country_code text not null default 'BR',
  phone text,
  whatsapp text,
  instagram text,
  website text,
  opening_hours jsonb not null default '{}'::jsonb,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  location geography(point, 4326) generated always as (
    case
      when latitude is not null and longitude is not null
        then st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326)::geography
      else null
    end
  ) stored,
  status public.business_status not null default 'inactive',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint businesses_category_fk foreign key (business_category_id)
    references public.business_categories (id) on update cascade on delete restrict,
  constraint businesses_name_not_blank check (btrim(name) <> ''),
  constraint businesses_country_code_length check (char_length(country_code) = 2),
  constraint businesses_state_length check (state is null or char_length(state) = 2),
  constraint businesses_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint businesses_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint businesses_coordinates_complete check (
    (latitude is null and longitude is null) or (latitude is not null and longitude is not null)
  ),
  constraint businesses_opening_hours_object check (jsonb_typeof(opening_hours) = 'object')
);

create table public.business_employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  profile_id uuid not null,
  role public.user_role not null default 'employee',
  is_active boolean not null default true,
  hired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint business_employees_business_fk foreign key (business_id)
    references public.businesses (id) on update cascade on delete restrict,
  constraint business_employees_profile_fk foreign key (profile_id)
    references public.profiles (id) on update cascade on delete restrict,
  constraint business_employees_business_role check (role in ('owner', 'manager', 'employee'))
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  description text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  radius_meters integer not null,
  status public.quote_status not null default 'waiting',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quote_requests_customer_fk foreign key (customer_id)
    references public.profiles (id) on update cascade on delete restrict,
  constraint quote_requests_description_not_blank check (btrim(description) <> ''),
  constraint quote_requests_latitude_range check (latitude between -90 and 90),
  constraint quote_requests_longitude_range check (longitude between -180 and 180),
  constraint quote_requests_radius_positive check (radius_meters > 0)
);

create table public.quote_request_images (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quote_request_images_request_fk foreign key (quote_request_id)
    references public.quote_requests (id) on update cascade on delete restrict,
  constraint quote_request_images_path_not_blank check (btrim(storage_path) <> ''),
  constraint quote_request_images_size_nonnegative check (size_bytes is null or size_bytes >= 0),
  constraint quote_request_images_position_nonnegative check (position >= 0)
);

create table public.quote_notifications (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null,
  business_id uuid not null,
  recipient_profile_id uuid,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quote_notifications_request_fk foreign key (quote_request_id)
    references public.quote_requests (id) on update cascade on delete restrict,
  constraint quote_notifications_business_fk foreign key (business_id)
    references public.businesses (id) on update cascade on delete restrict,
  constraint quote_notifications_recipient_fk foreign key (recipient_profile_id)
    references public.profiles (id) on update cascade on delete restrict,
  constraint quote_notifications_read_after_sent check (
    read_at is null or sent_at is null or read_at >= sent_at
  )
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null,
  business_id uuid not null,
  submitted_by_profile_id uuid,
  amount numeric(14, 2) not null,
  brand text,
  notes text,
  status public.quotation_status not null default 'pending',
  response_time_seconds integer,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quotations_request_fk foreign key (quote_request_id)
    references public.quote_requests (id) on update cascade on delete restrict,
  constraint quotations_business_fk foreign key (business_id)
    references public.businesses (id) on update cascade on delete restrict,
  constraint quotations_submitter_fk foreign key (submitted_by_profile_id)
    references public.profiles (id) on update cascade on delete restrict,
  constraint quotations_amount_nonnegative check (amount >= 0),
  constraint quotations_response_time_nonnegative check (
    response_time_seconds is null or response_time_seconds >= 0
  )
);

create table public.quotation_images (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quotation_images_quotation_fk foreign key (quotation_id)
    references public.quotations (id) on update cascade on delete restrict,
  constraint quotation_images_path_not_blank check (btrim(storage_path) <> ''),
  constraint quotation_images_size_nonnegative check (size_bytes is null or size_bytes >= 0),
  constraint quotation_images_position_nonnegative check (position >= 0)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint orders_quotation_fk foreign key (quotation_id)
    references public.quotations (id) on update cascade on delete restrict
);

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  business_id uuid not null,
  order_id uuid,
  score smallint not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint ratings_customer_fk foreign key (customer_id)
    references public.profiles (id) on update cascade on delete restrict,
  constraint ratings_business_fk foreign key (business_id)
    references public.businesses (id) on update cascade on delete restrict,
  constraint ratings_order_fk foreign key (order_id)
    references public.orders (id) on update cascade on delete restrict,
  constraint ratings_score_range check (score between 1 and 5)
);

create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  quote_notification_id uuid not null,
  channel text not null,
  delivery_status text not null,
  provider_message_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint notification_logs_notification_fk foreign key (quote_notification_id)
    references public.quote_notifications (id) on update cascade on delete restrict,
  constraint notification_logs_channel_not_blank check (btrim(channel) <> ''),
  constraint notification_logs_status_not_blank check (btrim(delivery_status) <> ''),
  constraint notification_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb not null default '{}'::jsonb,
  request_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint audit_logs_actor_fk foreign key (actor_profile_id)
    references public.profiles (id) on update cascade on delete set null,
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_old_values_object check (
    old_values is null or jsonb_typeof(old_values) = 'object'
  ),
  constraint audit_logs_new_values_object check (
    new_values is null or jsonb_typeof(new_values) = 'object'
  ),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create unique index profiles_email_active_uidx
  on public.profiles (lower(email)) where deleted_at is null;
create index profiles_role_active_idx
  on public.profiles (role, is_active) where deleted_at is null;

create unique index business_categories_slug_active_uidx
  on public.business_categories (lower(slug)) where deleted_at is null;
create index business_categories_active_name_idx
  on public.business_categories (is_active, name) where deleted_at is null;

create index businesses_category_status_idx
  on public.businesses (business_category_id, status) where deleted_at is null;
create index businesses_city_state_status_idx
  on public.businesses (state, city, status) where deleted_at is null;
create index businesses_location_gix
  on public.businesses using gist (location) where deleted_at is null and location is not null;

create unique index business_employees_business_profile_active_uidx
  on public.business_employees (business_id, profile_id) where deleted_at is null;
create index business_employees_profile_active_idx
  on public.business_employees (profile_id, is_active) where deleted_at is null;
create index business_employees_business_role_active_idx
  on public.business_employees (business_id, role, is_active) where deleted_at is null;

create index quote_requests_customer_created_idx
  on public.quote_requests (customer_id, created_at desc) where deleted_at is null;
create index quote_requests_status_created_idx
  on public.quote_requests (status, created_at desc) where deleted_at is null;
create index quote_requests_status_expires_idx
  on public.quote_requests (status, expires_at) where deleted_at is null;

create unique index quote_request_images_position_active_uidx
  on public.quote_request_images (quote_request_id, position) where deleted_at is null;
create unique index quote_request_images_path_active_uidx
  on public.quote_request_images (storage_path) where deleted_at is null;

create unique index quote_notifications_request_business_active_uidx
  on public.quote_notifications (quote_request_id, business_id) where deleted_at is null;
create index quote_notifications_business_read_created_idx
  on public.quote_notifications (business_id, read_at, created_at desc) where deleted_at is null;
create index quote_notifications_recipient_read_created_idx
  on public.quote_notifications (recipient_profile_id, read_at, created_at desc)
  where deleted_at is null and recipient_profile_id is not null;

create unique index quotations_request_business_active_uidx
  on public.quotations (quote_request_id, business_id) where deleted_at is null;
create index quotations_request_status_amount_idx
  on public.quotations (quote_request_id, status, amount) where deleted_at is null;
create index quotations_business_status_created_idx
  on public.quotations (business_id, status, created_at desc) where deleted_at is null;
create index quotations_submitter_created_idx
  on public.quotations (submitted_by_profile_id, created_at desc)
  where deleted_at is null and submitted_by_profile_id is not null;

create unique index quotation_images_position_active_uidx
  on public.quotation_images (quotation_id, position) where deleted_at is null;
create unique index quotation_images_path_active_uidx
  on public.quotation_images (storage_path) where deleted_at is null;

create unique index orders_quotation_active_uidx
  on public.orders (quotation_id) where deleted_at is null;
create index orders_status_created_idx
  on public.orders (status, created_at desc) where deleted_at is null;

create unique index ratings_order_customer_active_uidx
  on public.ratings (order_id, customer_id)
  where deleted_at is null and order_id is not null;
create index ratings_business_created_idx
  on public.ratings (business_id, created_at desc) where deleted_at is null;
create index ratings_business_score_idx
  on public.ratings (business_id, score) where deleted_at is null;
create index ratings_customer_created_idx
  on public.ratings (customer_id, created_at desc) where deleted_at is null;

create index notification_logs_notification_occurred_idx
  on public.notification_logs (quote_notification_id, occurred_at desc) where deleted_at is null;
create index notification_logs_status_occurred_idx
  on public.notification_logs (delivery_status, occurred_at desc) where deleted_at is null;
create index notification_logs_provider_message_idx
  on public.notification_logs (provider_message_id)
  where deleted_at is null and provider_message_id is not null;

create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc) where deleted_at is null;
create index audit_logs_actor_created_idx
  on public.audit_logs (actor_profile_id, created_at desc)
  where deleted_at is null and actor_profile_id is not null;
create index audit_logs_request_idx
  on public.audit_logs (request_id) where deleted_at is null and request_id is not null;
create index audit_logs_created_brin_idx
  on public.audit_logs using brin (created_at);

commit;
