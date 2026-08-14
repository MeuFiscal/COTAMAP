create policy "saas_public_plans_anon_read"
on public.saas_plans
for select
to anon
using (is_active = true and is_public = true);
