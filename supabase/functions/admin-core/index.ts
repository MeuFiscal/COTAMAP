import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

type Input = { operation: string; checkout_id?: string; plan_id?: string; price?: number; daily_limit?: number; settings?: Record<string, unknown> };

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const anon = Deno.env.get("SUPABASE_ANON_KEY"); const authorization = request.headers.get("Authorization");
    if (!url || !key || !anon || !authorization) return json({ error: "Unauthorized" }, 401);
    const user = createClient(url, anon, { global: { headers: { Authorization: authorization } } }); const service = createClient(url, key);
    const identity = await user.auth.getUser(); if (identity.error || !identity.data.user) return json({ error: "Unauthorized" }, 401);
    const body = await request.json() as Input; let result;
    if (body.operation === "activate_checkout" && body.checkout_id) result = await service.rpc("activate_checkout", { target_id: body.checkout_id, target_actor: identity.data.user.id });
    else if (body.operation === "update_plan" && body.plan_id && Number.isFinite(body.price) && Number.isInteger(body.daily_limit)) result = await service.rpc("update_plan", { target_plan: body.plan_id, target_price: body.price, target_limit: body.daily_limit, target_actor: identity.data.user.id });
    else if (body.operation === "update_settings" && body.settings) result = await service.rpc("update_platform_settings", { target: body.settings, target_actor: identity.data.user.id });
    else return json({ error: "Invalid parameters" }, 400);
    if (result.error) return json({ error: result.error.message }, 400);
    return json({ success: true });
  } catch (error) { return json({ error: error instanceof Error ? error.message : "Error" }, 500); }
});
