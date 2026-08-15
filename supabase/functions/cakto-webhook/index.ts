import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  actionForCaktoEvent,
  caktoEventId,
  effectiveCaktoEvent,
  normalizeCaktoEvent,
  parseCaktoItem,
  type JsonObject,
  type ParsedCaktoItem,
} from "../_shared/cakto-lifecycle.ts";

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-cakto-secret,x-webhook-secret",
};

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";

async function finish(
  db: SupabaseClient,
  ledgerId: string,
  status: "completed" | "failed",
  result: Record<string, unknown>,
  error?: string,
  businessId?: string,
  planId?: string,
) {
  const completed = await db.rpc("finish_payment_webhook_event", {
    p_ledger_id: ledgerId,
    p_status: status,
    p_result: result,
    p_error: error ?? null,
    p_business_id: businessId ?? null,
    p_plan_id: planId ?? null,
  });
  if (completed.error) throw completed.error;
}

async function resolveBusiness(db: SupabaseClient, email: string): Promise<{ id?: string; reason?: string }> {
  if (!email) return { reason: "customer_email_missing" };
  const profiles = await db.from("profiles").select("id").ilike("email", email).is("deleted_at", null).limit(2);
  if (profiles.error) throw profiles.error;
  if ((profiles.data ?? []).length !== 1) return { reason: profiles.data?.length ? "customer_ambiguous" : "customer_not_found" };
  const owners = await db.from("business_employees").select("business_id")
    .eq("profile_id", profiles.data![0].id).eq("role", "owner").eq("is_active", true).is("deleted_at", null);
  if (owners.error) throw owners.error;
  const ids = [...new Set((owners.data ?? []).map((row) => String(row.business_id)))];
  return ids.length === 1 ? { id: ids[0] } : { reason: ids.length ? "business_ambiguous" : "business_not_found" };
}

async function resolvePlan(db: SupabaseClient, parsed: ParsedCaktoItem): Promise<{ id?: string; reason?: string }> {
  if (!parsed.productId || !parsed.offerId) return { reason: "product_or_offer_missing" };
  const matches = await db.from("saas_plans").select("id")
    .eq("provider", "cakto").eq("provider_product_id", parsed.productId)
    .eq("provider_offer_id", parsed.offerId).eq("is_active", true).limit(2);
  if (matches.error) throw matches.error;
  if ((matches.data ?? []).length === 1) return { id: matches.data![0].id };
  return { reason: matches.data?.length ? "plan_ambiguous" : "plan_not_found" };
}

async function persistCurrentPeriodEnd(db: SupabaseClient, parsed: ParsedCaktoItem): Promise<void> {
  if (!parsed.subscriptionId) return;
  const period = await db.rpc("set_provider_subscription_period", {
    p_provider: "cakto",
    p_subscription_id: parsed.subscriptionId,
    p_current_period_end: parsed.currentPeriodEnd,
  });
  if (period.error) throw period.error;
  if (period.data?.result === "subscription_not_found" || period.data?.result === "invalid_subscription_identity") {
    throw new Error(String(period.data.result));
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const expected = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    let body: JsonObject;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "invalid_payload" }, 400);
      body = parsed as JsonObject;
    } catch {
      return json({ error: "invalid_payload" }, 400);
    }
    const supplied = request.headers.get("x-cakto-secret") || request.headers.get("x-webhook-secret") || text(body.secret);
    if (!expected || !supplied || supplied !== expected) return json({ error: "invalid_signature" }, 401);
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "not_configured" }, 500);
    const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const event = normalizeCaktoEvent(body.event ?? body.type);
    const rawRows = Array.isArray(body.data) ? body.data : [body.data ?? body];
    const outcomes: Record<string, number> = {};
    let retryableFailures = 0;
    let pendingCancellation = false;

    for (const raw of rawRows) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const parsed = parseCaktoItem(raw as JsonObject);
      const lifecycleEvent = effectiveCaktoEvent(event, parsed.status);
      const action = actionForCaktoEvent(lifecycleEvent);
      const eventId = await caktoEventId(event, parsed);
      const claim = await db.rpc("claim_payment_webhook_event", {
        p_provider: "cakto", p_event_name: event, p_event_id: eventId, p_payload: parsed.item,
        p_provider_subscription_id: parsed.subscriptionId || null, p_provider_order_id: parsed.orderId || null,
      });
      if (claim.error) throw claim.error;
      const ledger = Array.isArray(claim.data) ? claim.data[0] : claim.data;
      if (!ledger?.claimed) { outcomes.duplicate = (outcomes.duplicate ?? 0) + 1; continue; }
      const ledgerId = String(ledger.ledger_id);

      if (action === "ignore") {
        await finish(db, ledgerId, "completed", { result: "ignored_unknown_event", event });
        outcomes.ignored_unknown_event = (outcomes.ignored_unknown_event ?? 0) + 1;
        continue;
      }
      if (action === "renew" || action === "cancel" || action === "revoke") {
        try {
          await persistCurrentPeriodEnd(db, parsed);
        } catch (error) {
          const safe = error instanceof Error ? error.message : "period_end_persistence_failed";
          await finish(db, ledgerId, "failed", { result: "period_end_persistence_failed" }, safe);
          retryableFailures++; outcomes.failed = (outcomes.failed ?? 0) + 1; continue;
        }
        const applied = await db.rpc("apply_provider_subscription_event", {
          p_provider: "cakto", p_subscription_id: parsed.subscriptionId || null,
          p_order_id: parsed.orderId || null, p_event_name: lifecycleEvent,
          p_provider_status: parsed.status || lifecycleEvent, p_event_at: parsed.eventAt,
        });
        if (applied.error) {
          await finish(db, ledgerId, "failed", { result: "database_error" }, applied.error.message);
          retryableFailures++; outcomes.failed = (outcomes.failed ?? 0) + 1; continue;
        }
        const result = String(applied.data?.result ?? "processed");
        const retryable = result === "subscription_not_found";
        await finish(db, ledgerId, retryable ? "failed" : "completed", applied.data ?? { result }, retryable ? result : undefined);
        if (retryable) retryableFailures++;
        outcomes[result] = (outcomes[result] ?? 0) + 1;
        continue;
      }

      const business = await resolveBusiness(db, parsed.customerEmail);
      const plan = await resolvePlan(db, parsed);
      const missing = business.reason ?? plan.reason ?? (!parsed.subscriptionId ? "subscription_id_missing" : undefined);
      if (missing || !business.id || !plan.id) {
        await finish(db, ledgerId, "failed", { result: missing ?? "correlation_failed" }, missing ?? "correlation_failed");
        retryableFailures++; outcomes[missing ?? "correlation_failed"] = (outcomes[missing ?? "correlation_failed"] ?? 0) + 1;
        continue;
      }

      const applied = await db.rpc(action === "activate" ? "activate_provider_subscription" : "record_provider_subscription", {
        p_business_id: business.id, p_plan_id: plan.id, p_provider: "cakto",
        p_subscription_id: parsed.subscriptionId, p_order_id: parsed.orderId || null,
        p_product_id: parsed.productId, p_offer_id: parsed.offerId,
        p_provider_status: parsed.status || lifecycleEvent, p_event_at: parsed.eventAt,
      });
      if (applied.error) {
        await finish(db, ledgerId, "failed", { result: "database_error" }, applied.error.message, business.id, plan.id);
        retryableFailures++; outcomes.failed = (outcomes.failed ?? 0) + 1; continue;
      }
      try {
        await persistCurrentPeriodEnd(db, parsed);
      } catch (error) {
        const safe = error instanceof Error ? error.message : "period_end_persistence_failed";
        await finish(db, ledgerId, "failed", { result: "period_end_persistence_failed" }, safe, business.id, plan.id);
        retryableFailures++; outcomes.failed = (outcomes.failed ?? 0) + 1; continue;
      }
      const result = String(applied.data?.result ?? "processed");
      pendingCancellation = pendingCancellation || applied.data?.previous_cancellation_pending === true;
      const failed = result === "subscription_correlation_conflict" || result === "missing_subscription_id";
      await finish(db, ledgerId, failed ? "failed" : "completed", applied.data ?? { result }, failed ? result : undefined, business.id, plan.id);
      if (failed) retryableFailures++;
      outcomes[result] = (outcomes[result] ?? 0) + 1;
    }
    if (pendingCancellation) {
      const retrySecret = Deno.env.get("CAKTO_RETRY_SECRET");
      if (retrySecret) {
        EdgeRuntime.waitUntil(fetch(`${url}/functions/v1/cakto-subscription`, {
          method: "POST",
          headers: { "X-CotaMap-Retry-Secret": retrySecret, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "retry_pending" }),
        }).catch((error) => console.error("[cakto-webhook] cancellation worker unavailable", error instanceof Error ? error.message : "unknown_error")));
      }
    }
    return json({ ok: retryableFailures === 0, event, outcomes }, retryableFailures ? 500 : 200);
  } catch (error) {
    console.error("[cakto-webhook] processing error", error instanceof Error ? error.message : "unknown error");
    return json({ error: "internal_error" }, 500);
  }
});
