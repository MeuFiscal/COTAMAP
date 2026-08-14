create policy "saas_public_plans_authenticated_read"
on public.saas_plans
for select
to authenticated
using (is_active = true and is_public = true);
