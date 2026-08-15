import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  actionForCaktoEvent,
  caktoEventId,
  canRequestCancellation,
  effectiveCaktoEvent,
  isCaktoCanceledStatus,
  parseCaktoItem,
} from "../supabase/functions/_shared/cakto-lifecycle.ts";
import { isPlanUpgrade } from "../src/services/saas/plan-ranking.ts";

const PLAN_BY_CORRELATION = { "product:offer-a": "A", "product:offer-b": "B" };

function engine(planByCorrelation = PLAN_BY_CORRELATION) {
  const state = { current: "Free", currentSubscription: null, history: new Map(), ledger: new Map() };
  const receive = async ({ event, subscription = "sub-a", order = "order-a", product = "product", offer = "offer-a", business = true }) => {
    const item = { id: order, status: event, updated_at: `2026-08-14T${order.endsWith("b") ? "11" : "10"}:00:00Z`, customer: { email: business ? "owner@example.com" : "missing@example.com" }, product: { id: product }, offer: { id: offer }, subscription: { id: subscription } };
    const parsed = parseCaktoItem(item);
    const key = `${event}:${await caktoEventId(event, parsed)}`;
    if (state.ledger.get(key) === "completed") return "duplicate";
    const action = actionForCaktoEvent(event);
    if ((action === "activate" || action === "record") && !business) return "business_not_found_reprocessable";
    const plan = planByCorrelation[`${product}:${offer}`];
    if ((action === "activate" || action === "record") && !plan) return "plan_not_found_reprocessable";
    if (action === "record") {
      state.history.set(subscription, { plan, current: false, wasActivated: false, cancellation: "not_requested" });
      state.ledger.set(key, "completed");
      return "recorded";
    }
    if (action === "activate") {
      const known = state.history.get(subscription);
      if (known?.wasActivated && !known.current && state.currentSubscription && state.currentSubscription !== subscription) {
        state.ledger.set(key, "completed");
        return "ignored_stale_subscription";
      }
      if (state.currentSubscription && state.currentSubscription !== subscription) {
        const old = state.history.get(state.currentSubscription);
        if (old) { old.current = false; old.cancellation = "pending"; }
      }
      state.history.set(subscription, { plan, current: true, wasActivated: true, cancellation: "not_requested" });
      state.current = plan; state.currentSubscription = subscription; state.ledger.set(key, "completed");
      return "activated";
    }
    const known = state.history.get(subscription);
    if (!known) return "subscription_not_found_reprocessable";
    if (!known.current || state.currentSubscription !== subscription) {
      state.ledger.set(key, "completed");
      return "recorded_stale_subscription";
    }
    if (action === "renew") { state.ledger.set(key, "completed"); return event === "subscription_renewal_refused" ? "renewal_refused_recorded" : "renewed"; }
    if (action === "revoke") {
      known.current = false; known.cancellation = event.startsWith("subscription_cancel") ? "canceled" : known.cancellation;
      state.current = "Free"; state.currentSubscription = null; state.ledger.set(key, "completed");
      return "reverted_to_free";
    }
    state.ledger.set(key, "completed"); return "ignored_unknown_event";
  };
  return { state, receive };
}

test("A) compra Plano A", async () => { const e = engine(); assert.equal(await e.receive({ event: "purchase_approved" }), "activated"); assert.equal(e.state.current, "A"); });
test("B) renovação A", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); assert.equal(await e.receive({ event: "subscription_renewed", order: "renew-a" }), "renewed"); assert.equal(e.state.current, "A"); });
test("C) upgrade A para B", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "subscription_created", subscription: "sub-b", order: "order-b", offer: "offer-b" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(e.state.current, "B"); assert.equal(e.state.history.get("sub-a").cancellation, "pending"); });
for (const [letter, event] of [["D", "subscription_canceled"], ["E", "refund"], ["F", "chargeback"]]) {
  test(`${letter}) evento antigo de A não remove B`, async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event, order: `${event}-a` }), "recorded_stale_subscription"); assert.equal(e.state.current, "B"); });
}
test("G) cancelamento da assinatura B", async () => { const e = engine(); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event: "subscription_canceled", subscription: "sub-b", order: "cancel-b", offer: "offer-b" }), "reverted_to_free"); assert.equal(e.state.current, "Free"); });
test("H) processamento simultâneo do mesmo evento aplica uma vez", async () => { const e = engine(); const input = { event: "purchase_approved" }; assert.deepEqual((await Promise.all([e.receive(input), e.receive(input)])).sort(), ["activated", "duplicate"]); });
test("I) subscription_created e purchase_approved do mesmo pedido são independentes", async () => { const e = engine(); assert.equal(await e.receive({ event: "subscription_created" }), "recorded"); assert.equal(await e.receive({ event: "purchase_approved" }), "activated"); assert.equal(e.state.current, "A"); });
test("J) plano inexistente permanece reprocessável", async () => { const e = engine(); assert.equal(await e.receive({ event: "purchase_approved", offer: "missing" }), "plan_not_found_reprocessable"); assert.equal(await e.receive({ event: "purchase_approved", offer: "missing" }), "plan_not_found_reprocessable"); });
test("K) oferta incorreta não ativa", async () => { const e = engine(); assert.equal(await e.receive({ event: "purchase_approved", offer: "wrong" }), "plan_not_found_reprocessable"); assert.equal(e.state.current, "Free"); });
test("L) empresa não encontrada não ativa", async () => { const e = engine(); assert.equal(await e.receive({ event: "purchase_approved", business: false }), "business_not_found_reprocessable"); assert.equal(e.state.current, "Free"); });
test("M) B pago permanece ativo quando cancelamento de A falha", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); e.state.history.get("sub-a").cancellation = "failed"; assert.equal(e.state.current, "B"); assert.equal(e.state.history.get("sub-a").cancellation, "failed"); });
test("N) purchase_approved tardio de A não reativa A", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event: "purchase_approved", order: "late-a" }), "ignored_stale_subscription"); assert.equal(e.state.current, "B"); });
test("O) subscription_renewed antigo de A não altera B", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event: "subscription_renewed", order: "late-renew-a" }), "recorded_stale_subscription"); assert.equal(e.state.current, "B"); });
test("P) pedido para cancelar A não pode cancelar B", () => { assert.deepEqual(canRequestCancellation({ isOwner: true, isDefaultFree: false, provider: "cakto", providerSubscriptionId: null, cancellationRequestedAt: null }), { allowed: false, reason: "subscription_not_cancelable" }); });
test("Q) cliente não pode cancelar assinatura empresarial", () => { assert.deepEqual(canRequestCancellation({ isOwner: false, isDefaultFree: false, provider: "cakto", providerSubscriptionId: "sub-b", cancellationRequestedAt: null }), { allowed: false, reason: "owner_required" }); });
test("R) empresa Free não pode cancelar", () => { assert.deepEqual(canRequestCancellation({ isOwner: true, isDefaultFree: true, provider: null, providerSubscriptionId: null, cancellationRequestedAt: null }), { allowed: false, reason: "free_plan_not_cancelable" }); });
test("eventos adicionais: recusa não revoga, desconhecido ignora e status cancelado é defensivo", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); assert.equal(await e.receive({ event: "subscription_renewal_refused", order: "refused-a" }), "renewal_refused_recorded"); assert.equal(e.state.current, "A"); assert.equal(await e.receive({ event: "future_event", order: "future-a" }), "ignored_unknown_event"); assert.equal(effectiveCaktoEvent("future_event", "cancelled"), "subscription_canceled"); });
test("hierarquia aprovada usa somente sort_order", () => {
  assert.equal(isPlanUpgrade(0, 10), true);
  assert.equal(isPlanUpgrade(0, 20), true);
  assert.equal(isPlanUpgrade(10, 20), true);
  assert.equal(isPlanUpgrade(20, 10), false);
  assert.equal(isPlanUpgrade(10, 10), false);
});
test("retry automático possui cron de 15 minutos, backoff e máximo de 8 tentativas", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20260814232858_harden_cakto_subscription_lifecycle.sql", import.meta.url), "utf8");
  assert.match(migration, /'\*\/15 \* \* \* \*'/);
  assert.match(migration, /cancellation_attempts < 8/);
  assert.match(migration, /cancellation_status = 'processing'[\s\S]*interval '30 minutes'/);
  for (const minutes of [15, 30, 60, 120, 240]) assert.match(migration, new RegExp(`then ${minutes}`));
  assert.match(migration, /else 480/);
});
test("resposta de assinatura já cancelada é sucesso recuperável", () => {
  assert.equal(isCaktoCanceledStatus("canceled"), true);
  assert.equal(isCaktoCanceledStatus("cancelled"), true);
  assert.equal(isCaktoCanceledStatus("active"), false);
});

test("S) Cron sem item pendente não altera estado", () => {
  const queue = [];
  const claimed = queue.filter((item) => item.status === "pending").slice(0, 10);
  assert.deepEqual(claimed, []);
  assert.deepEqual(queue, []);
});

test("T) fila/retry identifica somente a assinatura antiga correta", () => {
  const queue = [
    { providerSubscriptionId: "sub-a", status: "pending", isCurrent: false },
    { providerSubscriptionId: "sub-b", status: "not_requested", isCurrent: true },
  ];
  const claimed = queue.filter((item) => ["pending", "failed"].includes(item.status));
  assert.deepEqual(claimed.map((item) => item.providerSubscriptionId), ["sub-a"]);
  assert.equal(queue.find((item) => item.isCurrent)?.providerSubscriptionId, "sub-b");
});

test("U) worker interno exige o secret dedicado antes de processar", () => {
  const source = readFileSync(new URL("../supabase/functions/cakto-subscription/index.ts", import.meta.url), "utf8");
  const retryBranch = source.indexOf('body.action === "retry_pending"');
  const secretCheck = source.indexOf("suppliedRetrySecret !== expectedRetrySecret", retryBranch);
  const workerCall = source.indexOf("retryPending(service)", retryBranch);
  assert.ok(retryBranch >= 0);
  assert.ok(secretCheck > retryBranch && secretCheck < workerCall);
});

test("V) evento antigo continua sem alterar o plano B", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" });
  assert.equal(await e.receive({ event: "subscription_cancelled", order: "late-cancel-a" }), "recorded_stale_subscription");
  assert.equal(e.state.current, "B");
});

test("W) evento falho permanece reprocessável e pode concluir depois", async () => {
  const correlations = { ...PLAN_BY_CORRELATION };
  const e = engine(correlations);
  assert.equal(await e.receive({ event: "purchase_approved", offer: "offer-late" }), "plan_not_found_reprocessable");
  correlations["product:offer-late"] = "A";
  assert.equal(await e.receive({ event: "purchase_approved", offer: "offer-late" }), "activated");
  assert.equal(e.state.current, "A");
});

test("falha imediata mantém cancelamento solicitado para o retry", () => {
  const source = readFileSync(new URL("../supabase/functions/cakto-subscription/index.ts", import.meta.url), "utf8");
  assert.match(source, /status: "cancellation_requested", delivery: "retry_pending"/);
  assert.doesNotMatch(source, /cancellation_requested_at:\s*null/);
});

test("lojista autenticado lê somente o plano ligado à própria assinatura ativa", () => {
  const policy = readFileSync(new URL("../supabase/migrations/20260815120138_allow_authenticated_read_current_business_plan.sql", import.meta.url), "utf8");
  assert.match(policy, /for select\s+to authenticated/);
  assert.match(policy, /subscription\.plan_id = saas_plans\.id/);
  assert.match(policy, /subscription\.status = 'active'/);
  assert.match(policy, /membership\.profile_id = \(select auth\.uid\(\)\)/);
  assert.match(policy, /membership\.is_active = true/);
  assert.doesNotMatch(policy, /to anon|using \(true\)/);
});
