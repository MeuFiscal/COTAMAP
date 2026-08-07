import { createClient } from "@/lib/supabase/client";

export async function getAdminOverview() {
  const supabase = createClient();
  const [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans] = await Promise.all([
    supabase.from("businesses").select("id,status"),
    supabase.from("profiles").select("id,role"),
    supabase.from("business_employees").select("id"),
    supabase.from("quote_requests").select("id"),
    supabase.from("quotations").select("id"),
    supabase.from("orders").select("id,status"),
    supabase.from("business_subscriptions").select("business_id,plan_id,status"),
    supabase.from("saas_plans").select("id,code"),
  ]);
  for (const result of [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans]) {
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
