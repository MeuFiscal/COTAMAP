begin;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_profile()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid();
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = 'admin'::public.user_role
      and profile.is_active
      and profile.deleted_at is null
  );
$$;

create or replace function private.has_business_role(
  target_business_id uuid,
  allowed_roles public.user_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_employees as membership
    inner join public.profiles as profile on profile.id = membership.profile_id
    where membership.business_id = target_business_id
      and membership.profile_id = auth.uid()
      and membership.role = any(allowed_roles)
      and membership.is_active
      and membership.deleted_at is null
      and profile.is_active
      and profile.deleted_at is null
  );
$$;

create or replace function private.current_businesses()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select membership.business_id
  from public.business_employees as membership
  inner join public.profiles as profile on profile.id = membership.profile_id
  where membership.profile_id = auth.uid()
    and membership.is_active
    and membership.deleted_at is null
    and profile.is_active
    and profile.deleted_at is null;
$$;

create or replace function private.is_owner(target_business_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_business_role(
    target_business_id,
    array['owner'::public.user_role]
  );
$$;

create or replace function private.is_manager(target_business_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_business_role(
    target_business_id,
    array['manager'::public.user_role]
  );
$$;

create or replace function private.is_employee(target_business_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_business_role(
    target_business_id,
    array['employee'::public.user_role]
  );
$$;

create or replace function private.can_view_business(target_business_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_business_role(
    target_business_id,
    array[
      'owner'::public.user_role,
      'manager'::public.user_role,
      'employee'::public.user_role
    ]
  );
$$;

create or replace function private.can_respond_for_business(target_business_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.has_business_role(
    target_business_id,
    array[
      'owner'::public.user_role,
      'manager'::public.user_role,
      'employee'::public.user_role
    ]
  );
$$;

create or replace function private.can_access_quote_request(target_quote_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.quote_requests as request
      where request.id = target_quote_request_id
        and request.customer_id = auth.uid()
        and request.deleted_at is null
    )
    or exists (
      select 1
      from public.quote_notifications as notification
      inner join public.business_employees as membership
        on membership.business_id = notification.business_id
      inner join public.profiles as profile on profile.id = membership.profile_id
      where notification.quote_request_id = target_quote_request_id
        and notification.deleted_at is null
        and membership.profile_id = auth.uid()
        and membership.role in (
          'owner'::public.user_role,
          'manager'::public.user_role,
          'employee'::public.user_role
        )
        and membership.is_active
        and membership.deleted_at is null
        and profile.is_active
        and profile.deleted_at is null
    );
$$;

create or replace function private.can_respond_to_quote_request(
  target_business_id uuid,
  target_quote_request_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    private.can_respond_for_business(target_business_id)
    and exists (
      select 1
      from public.quote_notifications as notification
      where notification.business_id = target_business_id
        and notification.quote_request_id = target_quote_request_id
        and notification.deleted_at is null
    );
$$;

create or replace function private.can_view_quotation(target_quotation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quotations as quotation
    inner join public.quote_requests as request
      on request.id = quotation.quote_request_id
    where quotation.id = target_quotation_id
      and quotation.deleted_at is null
      and request.deleted_at is null
      and (
        request.customer_id = auth.uid()
        or private.can_view_business(quotation.business_id)
      )
  );
$$;

create or replace function private.can_manage_quotation(target_quotation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quotations as quotation
    where quotation.id = target_quotation_id
      and quotation.deleted_at is null
      and private.can_respond_to_quote_request(
        quotation.business_id,
        quotation.quote_request_id
      )
  );
$$;

create or replace function private.can_view_order(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders as customer_order
    inner join public.quotations as quotation
      on quotation.id = customer_order.quotation_id
    inner join public.quote_requests as request
      on request.id = quotation.quote_request_id
    where customer_order.id = target_order_id
      and customer_order.deleted_at is null
      and quotation.deleted_at is null
      and request.deleted_at is null
      and (
        request.customer_id = auth.uid()
        or private.can_view_business(quotation.business_id)
      )
  );
$$;

create or replace function private.can_view_notification(target_notification_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.quote_notifications as notification
    where notification.id = target_notification_id
      and notification.deleted_at is null
      and (
        notification.recipient_profile_id = auth.uid()
        or private.can_view_business(notification.business_id)
      )
  );
$$;

create or replace function private.profile_security_fields_unchanged(
  target_profile_id uuid,
  target_role public.user_role,
  target_is_active boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.id = target_profile_id
      and profile.role = target_role
      and profile.is_active = target_is_active
  );
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'CotaMap requires an email address to create a profile';
  end if;

  profile_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Usuário'
  );

  insert into public.profiles (id, full_name, email, phone, avatar_url, role, is_active)
  values (
    new.id,
    profile_name,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    'customer'::public.user_role,
    true
  );

  return new;
end;
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function private.current_profile() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.has_business_role(uuid, public.user_role[]) to authenticated;
grant execute on function private.current_businesses() to authenticated;
grant execute on function private.is_owner(uuid) to authenticated;
grant execute on function private.is_manager(uuid) to authenticated;
grant execute on function private.is_employee(uuid) to authenticated;
grant execute on function private.can_view_business(uuid) to authenticated;
grant execute on function private.can_respond_for_business(uuid) to authenticated;
grant execute on function private.can_access_quote_request(uuid) to authenticated;
grant execute on function private.can_respond_to_quote_request(uuid, uuid) to authenticated;
grant execute on function private.can_view_quotation(uuid) to authenticated;
grant execute on function private.can_manage_quotation(uuid) to authenticated;
grant execute on function private.can_view_order(uuid) to authenticated;
grant execute on function private.can_view_notification(uuid) to authenticated;
grant execute on function private.profile_security_fields_unchanged(uuid, public.user_role, boolean)
  to authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger business_categories_set_updated_at
  before update on public.business_categories
  for each row execute function private.set_updated_at();
create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function private.set_updated_at();
create trigger business_employees_set_updated_at
  before update on public.business_employees
  for each row execute function private.set_updated_at();
create trigger quote_requests_set_updated_at
  before update on public.quote_requests
  for each row execute function private.set_updated_at();
create trigger quote_request_images_set_updated_at
  before update on public.quote_request_images
  for each row execute function private.set_updated_at();
create trigger quote_notifications_set_updated_at
  before update on public.quote_notifications
  for each row execute function private.set_updated_at();
create trigger quotations_set_updated_at
  before update on public.quotations
  for each row execute function private.set_updated_at();
create trigger quotation_images_set_updated_at
  before update on public.quotation_images
  for each row execute function private.set_updated_at();
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();
create trigger ratings_set_updated_at
  before update on public.ratings
  for each row execute function private.set_updated_at();
create trigger notification_logs_set_updated_at
  before update on public.notification_logs
  for each row execute function private.set_updated_at();
create trigger audit_logs_set_updated_at
  before update on public.audit_logs
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.business_categories enable row level security;
alter table public.businesses enable row level security;
alter table public.business_employees enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_request_images enable row level security;
alter table public.quote_notifications enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_images enable row level security;
alter table public.orders enable row level security;
alter table public.ratings enable row level security;
alter table public.notification_logs enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table
  public.profiles,
  public.business_categories,
  public.businesses,
  public.business_employees,
  public.quote_requests,
  public.quote_request_images,
  public.quote_notifications,
  public.quotations,
  public.quotation_images,
  public.orders,
  public.ratings,
  public.notification_logs,
  public.audit_logs
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.business_categories,
  public.businesses,
  public.business_employees,
  public.quote_requests,
  public.quote_request_images,
  public.quote_notifications,
  public.quotations,
  public.quotation_images,
  public.orders,
  public.ratings,
  public.notification_logs,
  public.audit_logs
to authenticated;

create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

create policy "profiles_update_own"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and (select private.profile_security_fields_unchanged(id, role, is_active))
);

create policy "profiles_admin_all"
on public.profiles for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "business_categories_select_active"
on public.business_categories for select to authenticated
using (is_active and deleted_at is null);

create policy "business_categories_admin_all"
on public.business_categories for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "businesses_select_members"
on public.businesses for select to authenticated
using ((select private.can_view_business(id)));

create policy "businesses_update_owners"
on public.businesses for update to authenticated
using ((select private.is_owner(id)))
with check ((select private.is_owner(id)));

create policy "businesses_admin_all"
on public.businesses for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "business_employees_select_members"
on public.business_employees for select to authenticated
using ((select private.can_view_business(business_id)));

create policy "business_employees_insert_owners"
on public.business_employees for insert to authenticated
with check ((select private.is_owner(business_id)));

create policy "business_employees_update_owners"
on public.business_employees for update to authenticated
using ((select private.is_owner(business_id)))
with check ((select private.is_owner(business_id)));

create policy "business_employees_delete_owners"
on public.business_employees for delete to authenticated
using ((select private.is_owner(business_id)));

create policy "business_employees_admin_all"
on public.business_employees for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "quote_requests_select_authorized"
on public.quote_requests for select to authenticated
using ((select private.can_access_quote_request(id)));

create policy "quote_requests_insert_customer"
on public.quote_requests for insert to authenticated
with check (customer_id = (select auth.uid()));

create policy "quote_requests_update_customer"
on public.quote_requests for update to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy "quote_requests_delete_customer"
on public.quote_requests for delete to authenticated
using (customer_id = (select auth.uid()));

create policy "quote_requests_admin_all"
on public.quote_requests for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "quote_request_images_select_authorized"
on public.quote_request_images for select to authenticated
using ((select private.can_access_quote_request(quote_request_id)));

create policy "quote_request_images_insert_customer"
on public.quote_request_images for insert to authenticated
with check (
  exists (
    select 1 from public.quote_requests as request
    where request.id = quote_request_id
      and request.customer_id = (select auth.uid())
      and request.deleted_at is null
  )
);

create policy "quote_request_images_update_customer"
on public.quote_request_images for update to authenticated
using (
  exists (
    select 1 from public.quote_requests as request
    where request.id = quote_request_id
      and request.customer_id = (select auth.uid())
      and request.deleted_at is null
  )
)
with check (
  exists (
    select 1 from public.quote_requests as request
    where request.id = quote_request_id
      and request.customer_id = (select auth.uid())
      and request.deleted_at is null
  )
);

create policy "quote_request_images_delete_customer"
on public.quote_request_images for delete to authenticated
using (
  exists (
    select 1 from public.quote_requests as request
    where request.id = quote_request_id
      and request.customer_id = (select auth.uid())
      and request.deleted_at is null
  )
);

create policy "quote_request_images_admin_all"
on public.quote_request_images for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "quote_notifications_select_business_members"
on public.quote_notifications for select to authenticated
using ((select private.can_view_notification(id)));

create policy "quote_notifications_admin_all"
on public.quote_notifications for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "quotations_select_authorized"
on public.quotations for select to authenticated
using ((select private.can_view_quotation(id)));

create policy "quotations_insert_business_members"
on public.quotations for insert to authenticated
with check (
  (select private.can_respond_to_quote_request(business_id, quote_request_id))
  and (
    submitted_by_profile_id is null
    or submitted_by_profile_id = (select auth.uid())
  )
);

create policy "quotations_update_business_members"
on public.quotations for update to authenticated
using ((select private.can_manage_quotation(id)))
with check (
  (select private.can_respond_to_quote_request(business_id, quote_request_id))
  and (
    submitted_by_profile_id is null
    or submitted_by_profile_id = (select auth.uid())
  )
);

create policy "quotations_delete_owners"
on public.quotations for delete to authenticated
using ((select private.is_owner(business_id)));

create policy "quotations_admin_all"
on public.quotations for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "quotation_images_select_authorized"
on public.quotation_images for select to authenticated
using ((select private.can_view_quotation(quotation_id)));

create policy "quotation_images_insert_business_members"
on public.quotation_images for insert to authenticated
with check ((select private.can_manage_quotation(quotation_id)));

create policy "quotation_images_update_business_members"
on public.quotation_images for update to authenticated
using ((select private.can_manage_quotation(quotation_id)))
with check ((select private.can_manage_quotation(quotation_id)));

create policy "quotation_images_delete_business_members"
on public.quotation_images for delete to authenticated
using ((select private.can_manage_quotation(quotation_id)));

create policy "quotation_images_admin_all"
on public.quotation_images for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "orders_select_authorized"
on public.orders for select to authenticated
using ((select private.can_view_order(id)));

create policy "orders_update_owners"
on public.orders for update to authenticated
using (
  exists (
    select 1
    from public.quotations as quotation
    where quotation.id = quotation_id
      and quotation.deleted_at is null
      and (select private.is_owner(quotation.business_id))
  )
)
with check (
  exists (
    select 1
    from public.quotations as quotation
    where quotation.id = quotation_id
      and quotation.deleted_at is null
      and (select private.is_owner(quotation.business_id))
  )
);

create policy "orders_admin_all"
on public.orders for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "ratings_select_authorized"
on public.ratings for select to authenticated
using (
  customer_id = (select auth.uid())
  or (select private.can_view_business(business_id))
);

create policy "ratings_insert_customer"
on public.ratings for insert to authenticated
with check (customer_id = (select auth.uid()));

create policy "ratings_update_customer"
on public.ratings for update to authenticated
using (customer_id = (select auth.uid()))
with check (customer_id = (select auth.uid()));

create policy "ratings_delete_customer"
on public.ratings for delete to authenticated
using (customer_id = (select auth.uid()));

create policy "ratings_admin_all"
on public.ratings for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "notification_logs_select_business_members"
on public.notification_logs for select to authenticated
using ((select private.can_view_notification(quote_notification_id)));

create policy "notification_logs_admin_all"
on public.notification_logs for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "audit_logs_admin_all"
on public.audit_logs for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

commit;
