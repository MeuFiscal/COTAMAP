import { createClient } from "@/lib/supabase/client";

export async function getAdminOverview() {
  const supabase = createClient();
  const [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans, audit] = await Promise.all([
    supabase.from("businesses").select("id,name,status,city,state"),
    supabase.from("profiles").select("id,full_name,email,role,is_active"),
    supabase.from("business_employees").select("id,business_id,profile_id,role,is_active,presence_status,last_access_at,last_activity_at"),
    supabase.from("quote_requests").select("id,part_name,status,created_at"),
    supabase.from("quotations").select("id,business_id,amount,status,created_at"),
    supabase.from("orders").select("id,quotation_id,status,created_at"),
    supabase.from("business_subscriptions").select("business_id,plan_id,status"),
    supabase.from("saas_plans").select("id,code"),
    supabase.from("audit_logs").select("id,actor_profile_id,entity_type,entity_id,action,created_at").order("created_at", { ascending: false }).limit(100),
  ]);
  for (const result of [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans, audit]) {
    if (result.error) throw result.error;
  }
  const premiumPlanIds = new Set((plans.data ?? []).filter((plan) => plan.code === "premium").map((plan) => plan.id));
  const premiumBusinessIds = new Set(
    (subscriptions.data ?? []).filter((subscription) => subscription.status === "active" && premiumPlanIds.has(subscription.plan_id)).map((subscription) => subscription.business_id),
  );
  return {
    businesses: businesses.data ?? [],
    profiles: profiles.data ?? [],
    employees: employees.data ?? [],
    requests: requests.data ?? [],
    quotations: quotations.data ?? [],
    orders: orders.data ?? [],
    premiumBusinessIds,
    audit: audit.data ?? [],
  };
}

export async function getAdminSaas() {
  const supabase = createClient();
  const [plans, features, links, checkouts] = await Promise.all([
    supabase.from("saas_plans").select("*").order("code"),
    supabase.from("saas_features").select("*"),
    supabase.from("saas_plan_features").select("*"),
    supabase.from("saas_checkouts").select("*").is("deleted_at", null).order("display_order"),
  ]);
  for (const result of [plans, features, links, checkouts]) {
    if (result.error) throw result.error;
  }
  return { plans: plans.data ?? [], features: features.data ?? [], links: links.data ?? [], checkouts: checkouts.data ?? [] };
}

export async function adminCore(body: Record<string, unknown>) {
  const { error } = await createClient().functions.invoke("admin-core", { body });
  if (error) throw new Error(error.message);
}
