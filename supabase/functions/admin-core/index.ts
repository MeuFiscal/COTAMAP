import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

type Input = {
  operation: string; checkout_id?: string; plan_id?: string; price?: number; daily_limit?: number | null;
  profile_id?: string; role?: string; business_id?: string; target_plan_id?: string;
  new_code?: string; new_name?: string; new_description?: string; checkout_url?: string; platform?: string;
  code?: string; name?: string; description?: string; promotional_price?: number | null;
  promotion_starts_at?: string | null; promotion_ends_at?: string | null; is_unlimited?: boolean;
  benefits?: unknown; provider?: string | null; provider_product_id?: string | null;
  provider_offer_id?: string | null; provider_checkout_id?: string | null;
  provider_checkout_url?: string | null; is_public?: boolean; is_active?: boolean; sort_order?: number; is_default_free?: boolean;
};

const CODE_PATTERN = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const codeOf = (value: unknown) => typeof value === "string" ? value.trim().toLowerCase() : "";
const textOf = (value: unknown) => typeof value === "string" ? value.trim() : "";
function benefitsOf(value: unknown): string[] | null {
  if (value === undefined) return null;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) throw new Error("benefits_invalid");
  return value.map((item) => item.trim());
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
    let result: any;

    if (body.operation === "delete_plan" && body.plan_id) {
      const plan = await service.from("saas_plans").select("id,is_default_free").eq("id", body.plan_id).maybeSingle();
      if (plan.error) result = plan;
      else if (!plan.data) return json({ error: "plan_not_found" }, 404);
      else if (plan.data.is_default_free) return json({ error: "default_free_locked" }, 409);
      else {
        const refs = await service.from("business_subscriptions").select("business_id").eq("plan_id", body.plan_id).limit(1);
        if (refs.error) result = refs;
        else if (refs.data?.length) return json({ error: "plan_has_subscription_history" }, 409);
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
          body.price < 0 || (!unlimited && (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0))) {
        return json({ error: "invalid_plan_values" }, 400);
      }
      result = await service.from("saas_plans").insert({
        code, name, description, price: body.price, promotional_price: body.promotional_price ?? null,
        promotion_starts_at: body.promotion_starts_at ?? null, promotion_ends_at: body.promotion_ends_at ?? null,
        daily_quote_limit: limit, is_unlimited: unlimited, is_public: body.is_public ?? true,
        is_default_free: false, sort_order: Number.isInteger(body.sort_order) ? body.sort_order : 0,
        benefits, provider: body.provider ?? null, provider_product_id: body.provider_product_id ?? null,
        provider_offer_id: body.provider_offer_id ?? null, provider_checkout_id: body.provider_checkout_id ?? null,
        provider_checkout_url: body.provider_checkout_url ?? null, is_active: body.is_active ?? true,
      });
    } else if (body.operation === "set_business_plan" && body.business_id && body.target_plan_id) {
      result = await service.rpc("set_business_plan", { target_business: body.business_id, target_plan: body.target_plan_id });
    } else if (body.operation === "update_profile" && body.profile_id && body.role) {
      result = await service.from("profiles").update({ role: body.role, is_active: true, updated_at: new Date().toISOString() }).eq("id", body.profile_id);
    } else if (body.operation === "deactivate_profile" && body.profile_id) {
      result = await service.from("profiles").update({ is_active: false, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", body.profile_id);
    } else if (body.operation === "delete_profile" && body.profile_id) {
      result = await service.from("profiles").update({ is_active: false, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", body.profile_id);
      if (!result.error) await service.auth.admin.deleteUser(body.profile_id);
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