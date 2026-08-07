create table if not exists public.notification_center (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  realtime_sent_at timestamptz,
  push_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token text not null,
  platform text not null,
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(profile_id, token)
);
create index notification_center_recipient_created_idx on public.notification_center(recipient_profile_id, created_at desc) where deleted_at is null;
create index push_devices_profile_active_idx on public.push_devices(profile_id, active) where deleted_at is null;
create trigger notification_center_set_updated_at before update on public.notification_center for each row execute function private.set_updated_at();
create trigger push_devices_set_updated_at before update on public.push_devices for each row execute function private.set_updated_at();
alter table public.notification_center enable row level security;
alter table public.push_devices enable row level security;
create policy notification_center_select_own on public.notification_center for select to authenticated using (recipient_profile_id = auth.uid() and deleted_at is null);
create policy notification_center_update_own on public.notification_center for update to authenticated using (recipient_profile_id = auth.uid()) with check (recipient_profile_id = auth.uid());
create policy push_devices_manage_own on public.push_devices for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
alter table public.notification_center replica identity full;
do $$ begin if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notification_center') then alter publication supabase_realtime add table public.notification_center; end if; end $$;
create or replace function public.mark_notification_read(target_id uuid) returns public.notification_center language sql security definer set search_path = public as $$ update public.notification_center set read_at = coalesce(read_at, now()), updated_at = now() where id = target_id and recipient_profile_id = auth.uid() and deleted_at is null returning *; $$;
create or replace function public.mark_all_notifications_read() returns bigint language sql security definer set search_path = public as $$ with updated as (update public.notification_center set read_at = coalesce(read_at, now()), updated_at = now() where recipient_profile_id = auth.uid() and read_at is null and deleted_at is null returning 1) select count(*) from updated; $$;
create or replace function public.delete_notification(target_id uuid) returns boolean language sql security definer set search_path = public as $$ update public.notification_center set deleted_at = now(), updated_at = now() where id = target_id and recipient_profile_id = auth.uid() and deleted_at is null returning true; $$;
revoke all on function public.mark_notification_read(uuid), public.mark_all_notifications_read(), public.delete_notification(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid), public.mark_all_notifications_read(), public.delete_notification(uuid) to authenticated;
revoke all on table public.notification_center, public.push_devices from anon;
grant select, update on table public.notification_center to authenticated;
grant select, insert, update, delete on table public.push_devices to authenticated;
