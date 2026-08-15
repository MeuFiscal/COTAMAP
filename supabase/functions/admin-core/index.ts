import { createClient, type SupabaseClient, type User } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

type Input = {
  operation: string; checkout_id?: string; plan_id?: string; price?: number; daily_limit?: number | null;
  profile_id?: string; role?: string; business_id?: string; target_plan_id?: string;
  expected_email?: string;
  new_code?: string; new_name?: string; new_description?: string; checkout_url?: string; platform?: string;
  code?: string; name?: string; description?: string; promotional_price?: number | null;
  promotion_starts_at?: string | null; promotion_ends_at?: string | null; is_unlimited?: boolean;
  benefits?: unknown; provider?: string | null; provider_product_id?: string | null;
  provider_offer_id?: string | null; provider_checkout_id?: string | null;
  provider_checkout_url?: string | null; is_public?: boolean; is_active?: boolean; sort_order?: number; is_default_free?: boolean;
};

type AdminOperationResult = { error: { code?: string; message: string } | null };

const CODE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const codeOf = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const textOf = (value: unknown) => typeof value === "string" ? value.trim() : "";
function benefitsOf(value: unknown): string[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) throw new Error("benefits_invalid");
  return value.map((item) => item.trim());
}

const recordOf = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const validDate = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};

async function listAuthUsers(service: SupabaseClient): Promise<User[]> {
  const users: User[] = [];
  for (let page = 1; page <= 100; page++) {
    const listed = await service.auth.admin.listUsers({ page, perPage: 1000 });
    if (listed.error) throw listed.error;
    users.push(...listed.data.users);
    if (listed.data.users.length < 1000) break;
  }
  return users;
}

async function adminOverview(service: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans, audit, usage, payments, authUsers] = await Promise.all([
    service.from("businesses").select("id,name,status,city,state,created_at,deleted_at").is("deleted_at", null),
    service.from("profiles").select("id,full_name,email,role,is_active,created_at,updated_at,deleted_at").is("deleted_at", null),
    service.from("business_employees").select("id,business_id,profile_id,role,is_active,presence_status,last_access_at,last_activity_at,deleted_at"),
    service.from("quote_requests").select("id,part_name,status,created_at"),
    service.from("quotations").select("id,business_id,amount,status,created_at"),
    service.from("orders").select("id,quotation_id,status,created_at"),
    service.from("business_subscriptions").select("business_id,plan_id,status,activated_at,changed_at,provider,provider_status,cancellation_requested_at,current_period_end"),
    service.from("saas_plans").select("id,code,name,price,promotional_price,daily_quote_limit,is_unlimited,is_default_free"),
    service.from("audit_logs").select("id,actor_profile_id,entity_type,entity_id,action,created_at").order("created_at", { ascending: false }).limit(100),
    service.from("saas_daily_usage").select("business_id,quotes_received").eq("usage_date", today),
    service.from("payment_webhook_events")
      .select("business_id,event_name,payload,processed_at,completed_at")
      .eq("processing_status", "completed")
      .in("event_name", ["purchase_approved", "subscription_renewed"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .order("processed_at", { ascending: false }),
    listAuthUsers(service),
  ]);
  for (const result of [businesses, profiles, employees, requests, quotations, orders, subscriptions, plans, audit, usage, payments]) {
    if (result.error) throw result.error;
  }

  const profileRows = profiles.data ?? [];
  const businessRows = businesses.data ?? [];
  const employeeRows = employees.data ?? [];
  const subscriptionRows = subscriptions.data ?? [];
  const planRows = plans.data ?? [];
  const authById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));
  const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
  const planById = new Map(planRows.map((plan) => [plan.id, plan]));
  const businessById = new Map(businessRows.map((business) => [business.id, business]));
  const subscriptionByBusiness = new Map(subscriptionRows.map((subscription) => [subscription.business_id, subscription]));
  const paymentByBusiness = new Map<string, string>();
  for (const payment of payments.data ?? []) {
    if (!payment.business_id || paymentByBusiness.has(payment.business_id)) continue;
    const payload = recordOf(payment.payload);
    const paidAt = validDate(payload.paidAt) ?? validDate(payload.paid_at)
      ?? validDate(payment.completed_at) ?? validDate(payment.processed_at);
    if (paidAt) paymentByBusiness.set(payment.business_id, paidAt);
  }

  const platformAdmins = await service.from("platform_admins").select("email,active");
  if (platformAdmins.error) throw platformAdmins.error;
  const adminEmails = new Set((platformAdmins.data ?? []).filter((item) => item.active).map((item) => item.email.toLowerCase()));

  const enrichedBusinesses = businessRows.map((business) => {
    const activeMembers = employeeRows.filter((employee) => employee.business_id === business.id && employee.is_active && !employee.deleted_at);
    const ownerMembership = activeMembers.find((employee) => employee.role === "owner");
    const owner = ownerMembership ? profileById.get(ownerMembership.profile_id) : null;
    const subscription = subscriptionByBusiness.get(business.id) ?? null;
    const plan = subscription ? planById.get(subscription.plan_id) ?? null : planRows.find((item) => item.is_default_free) ?? null;
    const usedToday = (usage.data ?? []).find((item) => item.business_id === business.id)?.quotes_received ?? 0;
    return {
      ...business,
      owner: owner ? { id: owner.id, name: owner.full_name, email: owner.email } : null,
      plan,
      subscription,
      last_payment_at: paymentByBusiness.get(business.id) ?? null,
      used_today: usedToday,
      active_employee_count: activeMembers.length,
    };
  });

  const enrichedProfiles = profileRows.map((profile) => {
    const membership = employeeRows.find((employee) => employee.profile_id === profile.id && employee.is_active && !employee.deleted_at);
    const business = membership ? businessById.get(membership.business_id) ?? null : null;
    const subscription = business ? subscriptionByBusiness.get(business.id) ?? null : null;
    const plan = subscription ? planById.get(subscription.plan_id) ?? null : null;
    const isPlatformAdmin = adminEmails.has(profile.email.toLowerCase());
    return {
      ...profile,
      account_type: isPlatformAdmin || profile.role === "admin" ? "admin" : membership ? "business" : "customer",
      is_platform_admin: isPlatformAdmin,
      last_access_at: authById.get(profile.id)?.last_sign_in_at ?? membership?.last_access_at ?? membership?.last_activity_at ?? null,
      business: business ? { id: business.id, name: business.name } : null,
      business_role: membership?.role ?? null,
      plan,
      subscription,
      last_payment_at: business ? paymentByBusiness.get(business.id) ?? null : null,
      has_active_business_membership: Boolean(membership),
    };
  });

  const premiumPlanIds = new Set(planRows.filter((plan) => plan.code === "premium").map((plan) => plan.id));
  const premiumBusinessIds = subscriptionRows
    .filter((subscription) => subscription.status === "active" && premiumPlanIds.has(subscription.plan_id))
    .map((subscription) => subscription.business_id);

  return {
    businesses: enrichedBusinesses,
    profiles: enrichedProfiles,
    employees: employeeRows,
    requests: requests.data ?? [],
    quotations: quotations.data ?? [],
    orders: orders.data ?? [],
    premiumBusinessIds,
    subscriptions: subscriptionRows,
    plans: planRows,
    audit: audit.data ?? [],
  };
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const authorization = req.headers.get("Authorization");
    if (!url || !key || !anon || !authorization) return json({ error: "Unauthorized" }, 401);

    const user = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const service = createClient(url, key);
    const identity = await user.auth.getUser();
    if (identity.error || !identity.data.user) return json({ error: "Unauthorized" }, 401);
    const { data: admin } = await service.from("platform_admins").select("active")
      .ilike("email", identity.data.user.email ?? "").maybeSingle();
    if (!admin?.active) return json({ error: "admin_not_authorized" }, 403);

    const body = await req.json() as Input;

    if (body.operation === "list_plans") {
      const plans = await service.from("saas_plans").select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (plans.error) return json({ error: plans.error.message }, 400);
      return json({ success: true, data: { plans: plans.data ?? [] } });
    }

    if (body.operation === "list_overview") {
      return json({ success: true, data: await adminOverview(service) });
    }

    let result: AdminOperationResult | undefined;

    if (body.operation === "delete_plan" && body.plan_id) {
      const plan = await service.from("saas_plans").select("id,is_default_free").eq("id", body.plan_id).maybeSingle();
      if (plan.error) result = plan;
      else if (!plan.data) return json({ error: "plan_not_found" }, 404);
      else if (plan.data.is_default_free) return json({ error: "default_free_locked" }, 409);
      else {
        const [currentRefs, historyRefs] = await Promise.all([
          service.from("business_subscriptions").select("business_id").eq("plan_id", body.plan_id).limit(1),
          service.from("business_provider_subscriptions").select("id").eq("plan_id", body.plan_id).limit(1),
        ]);
        if (currentRefs.error) result = currentRefs;
        else if (historyRefs.error) result = historyRefs;
        else if (currentRefs.data?.length || historyRefs.data?.length) return json({ error: "plan_has_subscription_history" }, 409);
        else result = await service.from("saas_plans").delete().eq("id", body.plan_id);
      }
    } else if (body.operation === "activate_checkout" && body.checkout_id) {
      result = await service.rpc("activate_checkout", { target_id: body.checkout_id, target_actor: identity.data.user.id });
    } else if (body.operation === "update_plan" && body.plan_id) {
      const current = await service.from("saas_plans").select("*").eq("id", body.plan_id).maybeSingle();
      if (current.error) result = current;
      else if (!current.data) return json({ error: "plan_not_found" }, 404);
      else {
        const plan = current.data as Record<string, unknown>;
        const code = body.code === undefined ? String(plan.code) : codeOf(body.code);
        const name = body.name === undefined ? String(plan.name) : textOf(body.name);
        const price = body.price === undefined ? Number(plan.price) : body.price;
        const unlimited = body.is_unlimited === undefined ? Boolean(plan.is_unlimited) : body.is_unlimited === true;
        const limit = unlimited ? null : (body.daily_limit === undefined ? plan.daily_quote_limit : body.daily_limit);
        if (!CODE_PATTERN.test(code) || !name || typeof price !== "number" || !Number.isFinite(price) || price < 0 ||
            (!unlimited && (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0)) ||
            (body.sort_order !== undefined && (!Number.isInteger(body.sort_order) || body.sort_order < 0))) {
          return json({ error: "invalid_plan_values" }, 400);
        }
        if ((plan.code === "free" || plan.code === "premium") && code !== plan.code) return json({ error: "protected_plan_code" }, 400);
        if (body.is_default_free === true && plan.is_default_free !== true) return json({ error: "default_free_locked" }, 400);

        if (body.is_active === false && plan.is_active === true) {
          const active = await service.from("business_subscriptions").select("business_id")
            .eq("plan_id", body.plan_id).eq("status", "active").limit(1);
          if (active.error) result = active;
          else if (active.data?.length) return json({ error: "plan_has_active_subscriptions" }, 409);
        }

        if (!result?.error) {
          const benefits = benefitsOf(body.benefits);
          const update: Record<string, unknown> = {
            code, name, description: body.description === undefined ? plan.description : textOf(body.description),
            price, daily_quote_limit: limit, is_unlimited: unlimited,
            is_public: body.is_public === undefined ? plan.is_public : body.is_public,
            is_active: body.is_active === undefined ? plan.is_active : body.is_active,
            sort_order: body.sort_order === undefined ? plan.sort_order : body.sort_order,
            promotional_price: body.promotional_price === undefined ? plan.promotional_price : body.promotional_price,
            promotion_starts_at: body.promotion_starts_at === undefined ? plan.promotion_starts_at : body.promotion_starts_at,
            promotion_ends_at: body.promotion_ends_at === undefined ? plan.promotion_ends_at : body.promotion_ends_at,
            provider: body.provider === undefined ? plan.provider : body.provider,
            provider_product_id: body.provider_product_id === undefined ? plan.provider_product_id : body.provider_product_id,
            provider_offer_id: body.provider_offer_id === undefined ? plan.provider_offer_id : body.provider_offer_id,
            provider_checkout_id: body.provider_checkout_id === undefined ? plan.provider_checkout_id : body.provider_checkout_id,
            provider_checkout_url: body.provider_checkout_url === undefined ? plan.provider_checkout_url : body.provider_checkout_url,
            updated_at: new Date().toISOString(),
          };
          if (benefits !== null) update.benefits = benefits;
          result = await service.from("saas_plans").update(update).eq("id", body.plan_id);
        }
      }
    } else if (body.operation === "update_checkout" && body.checkout_id && body.checkout_url) {
      result = await service.from("saas_checkouts").update({
        url: body.checkout_url, platform: body.platform ?? null, updated_at: new Date().toISOString()
      }).eq("id", body.checkout_id);
    } else if (body.operation === "create_plan") {
      const code = codeOf(body.new_code ?? body.code);
      const name = textOf(body.new_name ?? body.name);
      const description = textOf(body.new_description ?? body.description);
      const unlimited = body.is_unlimited === true;
      const limit = unlimited ? null : body.daily_limit;
      const benefits = benefitsOf(body.benefits) ?? [];
      if (!CODE_PATTERN.test(code) || !name || typeof body.price !== "number" || !Number.isFinite(body.price) ||
          body.price < 0 || (!unlimited && (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0)) ||
          (body.sort_order !== undefined && (!Number.isInteger(body.sort_order) || body.sort_order < 0))) {
        return json({ error: "invalid_plan_values" }, 400);
      }
      const highest = await service.from("saas_plans").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
      if (highest.error) throw highest.error;
      const order = Number.isInteger(body.sort_order)
        ? Number(body.sort_order)
        : (highest.data?.sort_order ?? 0) + 10;
      result = await service.from("saas_plans").insert({
        code, name, description, price: body.price, promotional_price: body.promotional_price ?? null,
        promotion_starts_at: body.promotion_starts_at ?? null, promotion_ends_at: body.promotion_ends_at ?? null,
        daily_quote_limit: limit, is_unlimited: unlimited, is_public: body.is_public ?? true,
        is_default_free: false, sort_order: order,
        benefits, provider: body.provider ?? null, provider_product_id: body.provider_product_id ?? null,
        provider_offer_id: body.provider_offer_id ?? null, provider_checkout_id: body.provider_checkout_id ?? null,
        provider_checkout_url: body.provider_checkout_url ?? null, is_active: body.is_active ?? true,
      });
    } else if (body.operation === "set_business_plan" && body.business_id && body.target_plan_id) {
      result = await service.rpc("set_business_plan", { target_business: body.business_id, target_plan: body.target_plan_id });
    } else if (body.operation === "reset_password" && body.profile_id) {
      const profile = await service.from("profiles").select("email,deleted_at").eq("id", body.profile_id).maybeSingle();
      if (profile.error) result = profile;
      else if (!profile.data || profile.data.deleted_at) return json({ error: "profile_not_found" }, 404);
      else {
        const reset = await user.auth.resetPasswordForEmail(profile.data.email, {
          redirectTo: `${Deno.env.get("PUBLIC_SITE_URL") ?? "https://www.cotamap.com.br"}/redefinir-senha`,
        });
        if (reset.error) return json({ error: "password_reset_failed" }, 400);
        return json({ success: true });
      }
    } else if (body.operation === "grant_admin" && body.profile_id) {
      const profile = await service.from("profiles").select("email,deleted_at").eq("id", body.profile_id).maybeSingle();
      if (profile.error) result = profile;
      else if (!profile.data || profile.data.deleted_at) return json({ error: "profile_not_found" }, 404);
      else {
        const granted = await service.from("platform_admins").upsert(
          { email: profile.data.email, active: true },
          { onConflict: "email" },
        );
        if (granted.error) result = granted;
        else result = await service.from("profiles").update({ role: "admin", updated_at: new Date().toISOString() }).eq("id", body.profile_id);
      }
    } else if (body.operation === "remove_admin" && body.profile_id) {
      if (body.profile_id === identity.data.user.id) return json({ error: "cannot_remove_own_admin" }, 409);
      const profile = await service.from("profiles").select("email,deleted_at").eq("id", body.profile_id).maybeSingle();
      if (profile.error) result = profile;
      else if (!profile.data || profile.data.deleted_at) return json({ error: "profile_not_found" }, 404);
      else {
        const removed = await service.from("platform_admins").update({ active: false }).ilike("email", profile.data.email);
        if (removed.error) result = removed;
        else result = await service.from("profiles").update({ role: "customer", updated_at: new Date().toISOString() }).eq("id", body.profile_id);
      }
    } else if (body.operation === "activate_profile" && body.profile_id) {
      result = await service.from("profiles").update({ is_active: true, deleted_at: null, updated_at: new Date().toISOString() }).eq("id", body.profile_id).is("deleted_at", null);
    } else if (body.operation === "update_profile" && body.profile_id && body.role) {
      result = await service.from("profiles").update({ role: body.role, is_active: true, updated_at: new Date().toISOString() }).eq("id", body.profile_id);
    } else if (body.operation === "deactivate_profile" && body.profile_id) {
      if (body.profile_id === identity.data.user.id) return json({ error: "cannot_deactivate_self" }, 409);
      result = await service.from("profiles").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", body.profile_id).is("deleted_at", null);
    } else if (body.operation === "delete_profile" && body.profile_id) {
      if (body.profile_id === identity.data.user.id) return json({ error: "cannot_delete_self" }, 409);
      const profile = await service.from("profiles").select("email,is_active,deleted_at").eq("id", body.profile_id).maybeSingle();
      if (profile.error) result = profile;
      else if (!profile.data || profile.data.deleted_at) return json({ error: "profile_not_found" }, 404);
      else if (profile.data.email.toLowerCase() !== textOf(body.expected_email).toLowerCase()) return json({ error: "delete_confirmation_mismatch" }, 400);
      else {
        const memberships = await service.from("business_employees").select("id")
          .eq("profile_id", body.profile_id).eq("is_active", true).is("deleted_at", null).limit(1);
        if (memberships.error) result = memberships;
        else if (memberships.data?.length) return json({ error: "profile_has_active_business_membership" }, 409);
        else {
          const deletedAt = new Date().toISOString();
          const tombstone = await service.from("profiles").update({ is_active: false, deleted_at: deletedAt, updated_at: deletedAt }).eq("id", body.profile_id);
          if (tombstone.error) result = tombstone;
          else {
            const authDeletion = await service.auth.admin.deleteUser(body.profile_id);
            if (authDeletion.error) {
              await service.from("profiles").update({ is_active: profile.data.is_active, deleted_at: null, updated_at: new Date().toISOString() }).eq("id", body.profile_id);
              return json({ error: "auth_user_delete_failed" }, 409);
            }
            await service.from("platform_admins").update({ active: false }).ilike("email", profile.data.email);
            return json({ success: true });
          }
        }
      }
    } else {
      return json({ error: "Invalid parameters" }, 400);
    }

    if (result?.error) {
      if (result.error.code === "23505") return json({ error: "plan_code_already_exists" }, 409);
      return json({ error: result.error.message }, 400);
    }
    return json({ success: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Error" }, 500);
  }
});
