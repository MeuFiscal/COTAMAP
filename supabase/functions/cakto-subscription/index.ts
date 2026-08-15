import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { canRequestCancellation, isCaktoCanceledStatus } from "../_shared/cakto-lifecycle.ts";
import { json, preflight } from "../_shared/cors.ts";

type Input = { action?: "cancel_current" | "retry_pending"; business_id?: string };
type CancellationResult = "sent" | "already_canceled";

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  try { return await response.json() as Record<string, unknown>; } catch { return {}; }
}

async function cancelAtCakto(subscriptionId: string): Promise<CancellationResult> {
  const clientId = Deno.env.get("CAKTO_CLIENT_ID");
  const clientSecret = Deno.env.get("CAKTO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("cakto_not_configured");
  const tokenResponse = await fetch("https://api.cakto.com.br/public_api/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
  });
  if (!tokenResponse.ok) throw new Error("cakto_auth_failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("cakto_auth_failed");
  const response = await fetch(`https://api.cakto.com.br/public_api/subscriptions/${encodeURIComponent(subscriptionId)}/cancel/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
  });
  if (response.ok) {
    const data = await responseJson(response);
    const status = typeof data.status === "string" ? data.status.toLowerCase() : "";
    return isCaktoCanceledStatus(status) ? "already_canceled" : "sent";
  }
  if (response.status === 400) {
    const current = await fetch(`https://api.cakto.com.br/public_api/subscriptions/${encodeURIComponent(subscriptionId)}/`, {
      headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" },
    });
    if (current.ok) {
      const data = await responseJson(current);
      const status = typeof data.status === "string" ? data.status.toLowerCase() : "";
      if (isCaktoCanceledStatus(status)) return "already_canceled";
    }
  }
  throw new Error(`cakto_cancel_${response.status}`);
}

async function recordAttempt(
  db: SupabaseClient,
  subscriptionId: string,
  status: "processing" | "sent" | "failed",
  error?: string,
  increment = true,
) {
  const now = new Date().toISOString();
  const values: Record<string, unknown> = {
    cancellation_status: status,
    cancellation_last_attempt_at: now,
    cancellation_error: error ? error.slice(0, 500) : null,
    updated_at: now,
  };
  if (status === "sent") values.cancellation_sent_at = now;
  const updated = await db.from("business_provider_subscriptions").update(values)
    .eq("provider", "cakto").eq("provider_subscription_id", subscriptionId);
  if (updated.error) throw updated.error;
  if (increment) {
    const incremented = await db.rpc("increment_provider_cancellation_attempt", { p_provider: "cakto", p_subscription_id: subscriptionId });
    if (incremented.error) throw incremented.error;
  }
}

async function recordCancellationSuccess(db: SupabaseClient, subscriptionId: string, result: CancellationResult) {
  if (result === "sent") {
    await recordAttempt(db, subscriptionId, "sent", undefined, false);
    return;
  }
  const applied = await db.rpc("apply_provider_subscription_event", {
    p_provider: "cakto",
    p_subscription_id: subscriptionId,
    p_order_id: null,
    p_event_name: "subscription_canceled",
    p_provider_status: "canceled",
    p_event_at: new Date().toISOString(),
  });
  if (applied.error) throw applied.error;
  if (applied.data?.result === "subscription_not_found" || applied.data?.result === "unmatched_or_ambiguous_subscription") {
    throw new Error("subscription_correlation_failed");
  }
}

async function retryPending(db: SupabaseClient) {
  const pending = await db.rpc("claim_pending_provider_cancellations", { p_limit: 10 });
  if (pending.error) throw pending.error;
  const results = { sent: 0, already_canceled: 0, failed: 0 };
  for (const row of pending.data ?? []) {
    const id = String(row.provider_subscription_id);
    try {
      const result = await cancelAtCakto(id);
      await recordCancellationSuccess(db, id, result);
      results[result]++;
    } catch (error) {
      const safe = error instanceof Error ? error.message : "cakto_cancel_failed";
      await recordAttempt(db, id, "failed", safe, false);
      results.failed++;
    }
  }
  return results;
}

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");
    if (!url || !anonKey || !serviceKey) return json({ error: "not_configured" }, 500);
    const service = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await request.json() as Input;

    if (body.action === "retry_pending") {
      const expectedRetrySecret = Deno.env.get("CAKTO_RETRY_SECRET");
      const suppliedRetrySecret = request.headers.get("X-CotaMap-Retry-Secret");
      if (!expectedRetrySecret || !suppliedRetrySecret || suppliedRetrySecret !== expectedRetrySecret) {
        return json({ error: "Forbidden" }, 403);
      }
      return json({ results: await retryPending(service) });
    }
    if (body.action !== "cancel_current" || !body.business_id) return json({ error: "invalid_parameters" }, 400);
    if (!authorization) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } },
    });
    const identity = await userClient.auth.getUser();
    if (identity.error || !identity.data.user) return json({ error: "Unauthorized" }, 401);
    const membership = await service.from("business_employees").select("role")
      .eq("business_id", body.business_id).eq("profile_id", identity.data.user.id)
      .eq("is_active", true).is("deleted_at", null).maybeSingle();
    if (membership.error) throw membership.error;

    const subscription = await service.from("business_subscriptions")
      .select("plan_id,provider,provider_subscription_id,cancellation_requested_at")
      .eq("business_id", body.business_id).eq("status", "active").maybeSingle();
    if (subscription.error) throw subscription.error;
    if (!subscription.data) return json({ error: "subscription_not_cancelable" }, 409);
    const plan = await service.from("saas_plans").select("is_default_free").eq("id", subscription.data.plan_id).maybeSingle();
    if (plan.error) throw plan.error;

    const permission = canRequestCancellation({
      isOwner: membership.data?.role === "owner",
      isDefaultFree: plan.data?.is_default_free === true,
      provider: subscription.data.provider,
      providerSubscriptionId: subscription.data.provider_subscription_id,
      cancellationRequestedAt: subscription.data.cancellation_requested_at,
    });
    if (!permission.allowed) {
      const denied = permission.reason === "owner_required" ? 403 : 409;
      return json({ error: permission.reason }, denied);
    }

    const subscriptionId = String(subscription.data.provider_subscription_id);
    const requested = await service.rpc("request_provider_subscription_cancellation", {
      p_business_id: body.business_id,
      p_subscription_id: subscriptionId,
    });
    if (requested.error) throw requested.error;
    if (requested.data?.result !== "cancellation_requested") return json({ error: "subscription_not_cancelable" }, 409);

    try {
      await recordAttempt(service, subscriptionId, "processing");
      const result = await cancelAtCakto(subscriptionId);
      await recordCancellationSuccess(service, subscriptionId, result);
      return json({ success: true, status: "cancellation_requested" });
    } catch (error) {
      const safe = error instanceof Error ? error.message : "cakto_cancel_failed";
      await recordAttempt(service, subscriptionId, "failed", safe, false);
      return json({ success: true, status: "cancellation_requested", delivery: "retry_pending" }, 202);
    }
  } catch (error) {
    console.error("[cakto-subscription] safe error", error instanceof Error ? error.message : "unknown_error");
    return json({ error: "internal_error" }, 500);
  }
});
