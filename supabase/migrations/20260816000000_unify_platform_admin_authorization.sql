begin;

-- platform_admins é a única fonte de autorização administrativa da plataforma.
-- O vínculo ocorre com auth.users por e-mail; nenhuma senha ou autenticação paralela é criada.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins administrator
    inner join auth.users authenticated_user
      on lower(authenticated_user.email) = lower(administrator.email)
    where authenticated_user.id = auth.uid()
      and administrator.active
  );
$$;

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated, service_role;

commit;
