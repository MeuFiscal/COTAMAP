import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

export type SaasPlan = {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  promotion_starts_at: string | null;
  promotion_ends_at: string | null;
  daily_quote_limit: number | null;
  is_unlimited: boolean;
  benefits: string[];
  is_default_free: boolean;
  sort_order: number;
  provider_checkout_url: string | null;
};

export type BusinessPlan = {
  businessId: string;
  plan: SaasPlan | null;
  features: Array<{ key: string; description: string }>;
  availablePlans: SaasPlan[];
  usedToday: number;
  limit: number | null;
  subscriptionStatus: string;
  providerStatus: string | null;
  cancellationRequestedAt: string | null;
  canCancel: boolean;
  canCancelReason: string | null;
};

const planFields = "id,code,name,description,price,promotional_price,promotion_starts_at,promotion_ends_at,daily_quote_limit,is_unlimited,benefits,is_default_free,sort_order,provider_checkout_url";

export async function getBusinessPlan(): Promise<BusinessPlan> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const session = await supabase.auth.getSession();
  if (!session.data.session) throw new Error("Sessão expirada.");
  const [subscription, membership, available] = await Promise.all([
    supabase.from("business_subscriptions")
      .select("plan_id,status,provider,provider_subscription_id,provider_status,cancellation_requested_at")
      .eq("business_id", businessId).eq("status", "active").maybeSingle(),
    supabase.from("business_employees").select("role")
      .eq("business_id", businessId).eq("profile_id", session.data.session.user.id)
      .eq("is_active", true).is("deleted_at", null).maybeSingle(),
    supabase.from("saas_plans").select(planFields)
      .eq("is_active", true).eq("is_public", true)
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ]);
  if (subscription.error) throw subscription.error;
  if (membership.error) throw membership.error;
  if (available.error) throw available.error;

  const planQuery = subscription.data
    ? supabase.from("saas_plans").select(planFields).eq("id", subscription.data.plan_id).maybeSingle()
    : supabase.from("saas_plans").select(planFields).eq("is_default_free", true).eq("is_active", true).limit(2);
  const planResult = await planQuery;
  if (planResult.error) throw planResult.error;
  const rawPlan = Array.isArray(planResult.data) ? (planResult.data.length === 1 ? planResult.data[0] : null) : planResult.data;
  const plan = rawPlan ? { ...rawPlan, benefits: Array.isArray(rawPlan.benefits) ? rawPlan.benefits as string[] : [] } : null;
  const availablePlans = (available.data ?? []).map((item) => ({
    ...item,
    benefits: Array.isArray(item.benefits) ? item.benefits as string[] : [],
  }));

  const [links, usage] = await Promise.all([
    plan ? supabase.from("saas_plan_features").select("feature_id").eq("plan_id", plan.id).eq("enabled", true) : Promise.resolve({ data: [], error: null }),
    supabase.from("saas_daily_usage").select("quotes_received")
      .eq("business_id", businessId).eq("usage_date", new Date().toISOString().slice(0, 10)).maybeSingle(),
  ]);
  if (links.error) throw links.error;
  const featureIds = (links.data ?? []).map((item) => item.feature_id);
  const features = featureIds.length
    ? await supabase.from("saas_features").select("key,description").in("id", featureIds)
    : { data: [], error: null };
  if (features.error) throw features.error;

  const isOwner = membership.data?.role === "owner";
  const isFree = plan?.is_default_free === true;
  const hasCancelableProvider = subscription.data?.provider === "cakto" && Boolean(subscription.data.provider_subscription_id);
  const cancellationRequestedAt = subscription.data?.cancellation_requested_at ?? null;
  const canCancel = isOwner && !isFree && hasCancelableProvider && !cancellationRequestedAt;
  const canCancelReason = canCancel ? null
    : !isOwner ? "Somente o proprietário pode cancelar a assinatura."
      : isFree ? "O plano gratuito não possui assinatura para cancelar."
        : cancellationRequestedAt ? "Cancelamento solicitado."
          : "Esta assinatura não permite cancelamento automático.";

  return {
    businessId,
    plan,
    features: features.data ?? [],
    availablePlans,
    usedToday: usage.data?.quotes_received ?? 0,
    limit: plan?.is_unlimited ? null : plan?.daily_quote_limit ?? null,
    subscriptionStatus: subscription.data?.status ?? "free",
    providerStatus: subscription.data?.provider_status ?? null,
    cancellationRequestedAt,
    canCancel,
    canCancelReason,
  };
}

export async function requestBusinessPlanCancellation(businessId: string): Promise<void> {
  const { data, error } = await createClient().functions.invoke("cakto-subscription", {
    body: { action: "cancel_current", business_id: businessId },
  });
  if (error) throw error;
  if (data?.status !== "cancellation_requested") throw new Error(data?.error ?? "cancellation_request_failed");
}
