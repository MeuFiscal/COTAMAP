create policy "saas_current_business_plan_authenticated_read"
on public.saas_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.business_subscriptions subscription
    join public.business_employees membership
      on membership.business_id = subscription.business_id
    where subscription.plan_id = saas_plans.id
      and subscription.status = 'active'
      and membership.profile_id = (select auth.uid())
      and membership.is_active = true
      and membership.deleted_at is null
  )
);
