import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type,x-cakto-secret,x-webhook-secret",
};

const ACTIVATION_EVENTS = new Set(["purchase_approved"]);
const REVOCATION_EVENTS = new Set(["refund", "chargeback", "subscription_canceled", "subscription_cancelled"]);
const REVOCATION_STATUSES = new Set(["refunded", "chargedback", "canceled", "cancelled"]);

type CaktoItem = Record<string, unknown>;

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function deterministicEventId(event: string, item: CaktoItem): Promise<string> {
  const explicit = text(item.id).trim() || text(item.refId).trim();
  if (explicit) return explicit;

  const customer = item.customer && typeof item.customer === "object" ? item.customer as CaktoItem : {};
  const product = item.product && typeof item.product === "object" ? item.product as CaktoItem : {};
  const offer = item.offer && typeof item.offer === "object" ? item.offer as CaktoItem : {};
  const stable = [
    event,
    text(customer.email).trim().toLowerCase(),
    text(product.id).trim(),
    text(offer.id).trim(),
    text(item.createdAt).trim(),
    text(item.paidAt).trim(),
    text(item.status).trim().toLowerCase(),
    text(item.subscription).trim(),
  ].join("|");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stable));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function findUserByEmail(db: ReturnType<typeof createClient>, email: string) {
  const users = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;
  return users.data.users.find((user) => (user.email ?? "").trim().toLowerCase() === email) ?? null;
}

Deno.serve(async (request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS" } });
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const expected = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    const suppliedHeader = request.headers.get("x-cakto-secret") || request.headers.get("x-webhook-secret");
    let body: CaktoItem;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object") return json({ error: "invalid_payload" }, 400);
      body = parsed as CaktoItem;
    } catch {
      return json({ error: "invalid_payload" }, 400);
    }

    const supplied = suppliedHeader || text(body.secret);
    if (!expected || !supplied || supplied !== expected) return json({ error: "invalid_signature" }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "not_configured" }, 500);

    const db = createClient(url, serviceKey);
    const event = text(body.event || body.type || "unknown").trim().toLowerCase();
    const rawRows = Array.isArray(body.data) ? body.data : [body.data ?? body];
    let handled = 0;
    let ambiguous = 0;
    let unmatched = 0;
    let duplicate = 0;
    let planNotFound = 0;
    let inactivePlan = 0;

    for (const rawItem of rawRows) {
      if (!rawItem || typeof rawItem !== "object") continue;
      const item = rawItem as CaktoItem;
      const eventId = await deterministicEventId(event, item);
      const inserted = await db.from("payment_webhook_events").insert({
        event_id: eventId,
        provider: "cakto",
        event_name: event,
        payload: item,
      });
      if (inserted.error?.code === "23505") { duplicate++; continue; }
      if (inserted.error) throw inserted.error;

      const product = item.product && typeof item.product === "object" ? text((item.product as CaktoItem).id).trim() : "";
      const offer = item.offer && typeof item.offer === "object" ? text((item.offer as CaktoItem).id).trim() : "";

      const status = text(item.status).trim().toLowerCase();
      const isRevocation = REVOCATION_EVENTS.has(event) || REVOCATION_STATUSES.has(status);
      if (!isRevocation && !ACTIVATION_EVENTS.has(event)) continue;

      const customer = item.customer && typeof item.customer === "object" ? item.customer as CaktoItem : {};
      const email = text(customer.email).trim().toLowerCase();
      if (!email) {
        unmatched++;
        continue;
      }

      const user = await findUserByEmail(db, email);
      if (!user) {
        unmatched++;
        continue;
      }

      const owners = await db
        .from("business_employees")
        .select("business_id")
        .eq("profile_id", user.id)
        .eq("role", "owner")
        .eq("is_active", true)
        .is("deleted_at", null);
      if (owners.error) throw owners.error;

      const businessIds = [...new Set((owners.data ?? []).map((row) => row.business_id))];
      if (businessIds.length !== 1) {
        if (businessIds.length > 1) ambiguous++;
        else unmatched++;
        continue;
      }

      let planId: string;
      if (isRevocation) {
        const freePlans = await db.from("saas_plans").select("id").eq("is_default_free", true).eq("is_active", true).limit(2);
        if (freePlans.error) throw freePlans.error;
        if ((freePlans.data ?? []).length !== 1) return json({ ok: false, event, result: "free_plan_configuration" }, 500);
        planId = freePlans.data[0].id;
      } else {
        if (!product || !offer) { planNotFound++; continue; }
        const activeMatches = await db.from("saas_plans").select("id").eq("provider", "cakto").eq("provider_product_id", product).eq("provider_offer_id", offer).eq("is_active", true).limit(2);
        if (activeMatches.error) throw activeMatches.error;
        if ((activeMatches.data ?? []).length > 1) { ambiguous++; continue; }
        if ((activeMatches.data ?? []).length === 0) {
          const anyMatches = await db.from("saas_plans").select("id,is_active").eq("provider", "cakto").eq("provider_product_id", product).eq("provider_offer_id", offer).limit(2);
          if (anyMatches.error) throw anyMatches.error;
          if ((anyMatches.data ?? []).length > 0) inactivePlan++;
          else planNotFound++;
          continue;
        }
        planId = activeMatches.data[0].id;
      }

      const existing = await db
        .from("business_subscriptions")
        .select("activated_at,plan_id,status")
        .eq("business_id", businessIds[0])
        .maybeSingle();
      if (existing.error) throw existing.error;

      const now = new Date().toISOString();
      const activatedAt = !isRevocation && existing.data?.plan_id !== planId
        ? now
        : existing.data?.activated_at ?? now;
      const subscription = await db.from("business_subscriptions").upsert({
        business_id: businessIds[0],
        plan_id: planId,
        status: "active",
        activated_at: activatedAt,
        changed_at: now,
      }, { onConflict: "business_id" });
      if (subscription.error) throw subscription.error;
      handled++;
    }

    return json({ ok: true, event, handled, ambiguous, unmatched, duplicate, planNotFound, inactivePlan });
  } catch (error) {
    console.error("[cakto-webhook] processing error", error instanceof Error ? error.message : "unknown error");
    return json({ error: "internal_error" }, 500);
  }
});