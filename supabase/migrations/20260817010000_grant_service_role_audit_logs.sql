-- admin-core writes administrative audit entries and reads recent entries for list_overview.
-- Keep audit_logs inaccessible to anon/authenticated beyond existing RLS policies.
grant select, insert
on table public.audit_logs
to service_role;
