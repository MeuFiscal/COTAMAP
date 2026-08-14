import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

export type BusinessPlan = {
  plan: {
    id: string;
    code: string;
    name: string;
    description: string;
    price: number;
    promotional_price: number | null;
    promotion_starts_at: string | null;
    promotion_ends_at: string | null;
    daily_quote_limit: number | null;
  } | null;
  features: Array<{ key: string; description: string }>;
  usedToday: number;
  limit: number | null;
  checkout: { name: string; url: string } | null;
};

export async function getBusinessPlan(): Promise<BusinessPlan> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();

  const subscription = await supabase
    .from("business_subscriptions")
    .select("plan_id,status")
    .eq("business_id", businessId)
    .eq("status", "active")
    .maybeSingle();
  if (subscription.error) { /* trata contas antigas sem assinatura como Free */ }

  const planQuery = subscription.data
    ? supabase.from("saas_plans").select("id,code,name,description,price,promotional_price,promotion_starts_at,promotion_ends_at,daily_quote_limit").eq("id", subscription.data.plan_id).eq("is_active", true).maybeSingle()
    : supabase.from("saas_plans").select("id,code,name,description,price,promotional_price,promotion_starts_at,promotion_ends_at,daily_quote_limit").eq("code", "free").eq("is_active", true).maybeSingle();
  const plan = await planQuery;
  if (plan.error) { return { plan: null, features: [], usedToday: 0, limit: null, checkout: null }; }
  if (!plan.data) return { plan: null, features: [], usedToday: 0, limit: null, checkout: null };

  const links = await supabase.from("saas_plan_features").select("feature_id").eq("plan_id", plan.data.id).eq("enabled", true);
  if (links.error) { return { plan: plan.data, features: [], usedToday: 0, limit: plan.data.daily_quote_limit, checkout: null }; }
  const featureIds = links.data.map((item) => item.feature_id);
  const features = featureIds.length
    ? await supabase.from("saas_features").select("key,description").in("id", featureIds)
    : { data: [], error: null };
  if (features.error) throw features.error;

  const usage = await supabase.from("saas_daily_usage").select("quotes_received").eq("business_id", businessId).eq("usage_date", new Date().toISOString().slice(0, 10)).maybeSingle();
  if (usage.error) { /* uso indisponível não impede visualizar o plano */ }
  const checkout = await supabase.from("saas_checkouts").select("name,url").eq("is_active", true).is("deleted_at", null).order("display_order").limit(1).maybeSingle();
  if (checkout.error) { /* checkout opcional */ }

  return {
    plan: plan.data,
    features: features.data ?? [],
    usedToday: usage.data?.quotes_received ?? 0,
    limit: plan.data.daily_quote_limit,
    checkout: checkout.data,
  };
}
