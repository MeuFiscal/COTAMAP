import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AdminPlan = Database["public"]["Tables"]["saas_plans"]["Row"];

export type AdminPlanSummary = Pick<AdminPlan, "id" | "code" | "name" | "price" | "promotional_price" | "daily_quote_limit" | "is_unlimited" | "is_default_free">;
export type AdminSubscriptionSummary = {
  business_id: string; plan_id: string; status: string; activated_at: string; changed_at: string;
  provider: string | null; provider_status: string | null; cancellation_requested_at: string | null; current_period_end: string | null;
};
export type AdminProfileSummary = {
  id: string; full_name: string; email: string; role: string; is_active: boolean; created_at: string; updated_at: string;
  account_type: "customer" | "business" | "admin"; is_platform_admin: boolean; last_access_at: string | null;
  business: { id: string; name: string } | null; business_role: string | null; plan: AdminPlanSummary | null;
  subscription: AdminSubscriptionSummary | null; last_payment_at: string | null; has_active_business_membership: boolean;
};
export type AdminBusinessSummary = {
  id: string; name: string; status: string; city: string | null; state: string | null; created_at: string;
  owner: { id: string; name: string; email: string } | null; plan: AdminPlanSummary | null;
  subscription: AdminSubscriptionSummary | null; last_payment_at: string | null; used_today: number | null; active_employee_count: number;
};
export type AdminOverview = {
  businesses: AdminBusinessSummary[];
  profiles: AdminProfileSummary[];
  employees: Array<{ id: string; business_id: string; profile_id: string; role: string; is_active: boolean; presence_status: string | null; last_access_at: string | null; last_activity_at: string | null; deleted_at: string | null }>;
  requests: Array<{ id: string; part_name: string; status: string; created_at: string }>;
  quotations: Array<{ id: string; business_id: string; amount: number; status: string; created_at: string }>;
  orders: Array<{ id: string; quotation_id: string; status: string; created_at: string }>;
  premiumBusinessIds: string[];
  subscriptions: AdminSubscriptionSummary[];
  plans: AdminPlanSummary[];
  audit: Array<{ id: string; actor_profile_id: string | null; entity_type: string; entity_id: string | null; action: string; created_at: string }>;
};

async function invokeAdminCore<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await createClient().functions.invoke("admin-core", { body });
  if (error) {
    let message = error.message;
    if ("context" in error && error.context instanceof Response) {
      try {
        const response = await error.context.clone().json() as { error?: string };
        if (response.error) message = response.error;
      } catch {}
    }
    throw new Error(message);
  }
  const response = data as { data?: T; error?: string } | null;
  if (response?.error) throw new Error(response.error);
  return response?.data as T;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return invokeAdminCore<AdminOverview>({ operation: "list_overview" });
}

async function getAdminPlans(): Promise<AdminPlan[]> {
  const data = await invokeAdminCore<{ plans: AdminPlan[] }>({ operation: "list_plans" });
  return data.plans;
}

export async function getAdminSaas() {
  const supabase = createClient();
  const [plans, features, links, checkouts] = await Promise.all([
    getAdminPlans(),
    supabase.from("saas_features").select("*"),
    supabase.from("saas_plan_features").select("*"),
    supabase.from("saas_checkouts").select("*").is("deleted_at", null).order("display_order"),
  ]);
  for (const result of [features, links, checkouts]) if (result.error) throw result.error;
  return { plans, features: features.data ?? [], links: links.data ?? [], checkouts: checkouts.data ?? [] };
}

export async function adminCore(body: Record<string, unknown>) {
  await invokeAdminCore<undefined>(body);
}
export type CaktoProduct={id:string;name:string;price:number|null;type:string;status:string;image:string|null};
export type CaktoOffer={id:string;name:string;price:number|null;product:string;status:string;type:string;recurrence_period:number|null;quantity_recurrences:number|null;trial_days:number|null;default:boolean};
export async function getCaktoCatalog(action:"products"|"offers",product_id?:string){const {data,error}=await createClient().functions.invoke("cakto-catalog",{body:{action,...(product_id?{product_id}:{})}});if(error)throw error;return data as {products?:CaktoProduct[];offers?:CaktoOffer[]};}
