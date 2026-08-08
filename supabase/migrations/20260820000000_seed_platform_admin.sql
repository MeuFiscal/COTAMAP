-- Idempotent platform administrator bootstrap. Authorization remains based on platform_admins.
insert into public.platform_admins (email, active)
values ('fernandocroxiatti@gmail.com', true)
on conflict (email) do update set active = excluded.active;

update public.profiles profile
set role = 'admin'::public.user_role, updated_at = now()
from auth.users authenticated_user
where profile.id = authenticated_user.id
  and lower(authenticated_user.email) = 'fernandocroxiatti@gmail.com'
  and exists (
    select 1 from public.platform_admins administrator
    where lower(administrator.email) = lower(authenticated_user.email)
      and administrator.active
  );
