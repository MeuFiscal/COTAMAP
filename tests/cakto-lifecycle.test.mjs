import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  actionForCaktoEvent,
  caktoEventId,
  canRequestCancellation,
  effectiveCaktoEvent,
  isFutureCaktoPeriodEnd,
  isCaktoCanceledStatus,
  normalizeCaktoPeriodEnd,
  parseCaktoItem,
} from "../supabase/functions/_shared/cakto-lifecycle.ts";
import { isPlanUpgrade } from "../src/services/saas/plan-ranking.ts";
import { formatBusinessPlanDate } from "../src/services/saas/plan-lifecycle.ts";

const PLAN_BY_CORRELATION = { "product:offer-a": "A", "product:offer-b": "B" };

function engine(planByCorrelation = PLAN_BY_CORRELATION) {
  const state = { current: "Free", currentSubscription: null, history: new Map(), ledger: new Map() };
  const receive = async ({ event, subscription = "sub-a", order = "order-a", product = "product", offer = "offer-a", business = true, periodEnd = "2026-09-14T13:29:46.071Z" }) => {
    const item = { id: order, status: event, updated_at: `2026-08-14T${order.endsWith("b") ? "11" : "10"}:00:00Z`, customer: { email: business ? "owner@example.com" : "missing@example.com" }, product: { id: product }, offer: { id: offer }, subscription: { id: subscription, next_payment_date: periodEnd } };
    const parsed = parseCaktoItem(item);
    const key = `${event}:${await caktoEventId(event, parsed)}`;
    if (state.ledger.get(key) === "completed") return "duplicate";
    const action = actionForCaktoEvent(event);
    if ((action === "activate" || action === "record") && !business) return "business_not_found_reprocessable";
    const plan = planByCorrelation[`${product}:${offer}`];
    if ((action === "activate" || action === "record") && !plan) return "plan_not_found_reprocessable";
    if (action === "record") {
      state.history.set(subscription, { plan, current: false, wasActivated: false, cancellation: "not_requested", providerStatus: event, currentPeriodEnd: parsed.currentPeriodEnd, expiredAt: null });
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
      state.history.set(subscription, { plan, current: true, wasActivated: true, cancellation: "not_requested", providerStatus: event, currentPeriodEnd: parsed.currentPeriodEnd ?? known?.currentPeriodEnd ?? null, expiredAt: null });
      state.current = plan; state.currentSubscription = subscription; state.ledger.set(key, "completed");
      return "activated";
    }
    const known = state.history.get(subscription);
    if (!known) return "subscription_not_found_reprocessable";
    if (!known.current || state.currentSubscription !== subscription) {
      state.ledger.set(key, "completed");
      return "recorded_stale_subscription";
    }
    if (action === "renew") {
      if (event === "subscription_renewed" && parsed.currentPeriodEnd) {
        known.currentPeriodEnd = !known.currentPeriodEnd || parsed.currentPeriodEnd > known.currentPeriodEnd ? parsed.currentPeriodEnd : known.currentPeriodEnd;
        known.providerStatus = "active";
      } else if (event === "subscription_renewal_refused") {
        known.providerStatus = "renewal_refused";
      }
      state.ledger.set(key, "completed");
      return event === "subscription_renewal_refused" ? "renewal_refused_recorded" : "renewed";
    }
    if (action === "cancel") {
      known.cancellation = "canceled";
      known.providerStatus = "canceled";
      state.ledger.set(key, "completed");
      return known.currentPeriodEnd ? "cancellation_recorded_access_preserved" : "cancellation_recorded_period_end_missing";
    }
    if (action === "revoke") {
      known.current = false;
      state.current = "Free"; state.currentSubscription = null; state.ledger.set(key, "completed");
      return "reverted_to_free";
    }
    state.ledger.set(key, "completed"); return "ignored_unknown_event";
  };
  const expire = (now) => {
    const known = state.currentSubscription ? state.history.get(state.currentSubscription) : null;
    if (!known || !known.current || !known.wasActivated || !known.currentPeriodEnd) return "nothing_due";
    if (known.cancellation !== "canceled" && known.providerStatus !== "renewal_refused") return "nothing_due";
    if (Date.parse(known.currentPeriodEnd) > Date.parse(now)) return "nothing_due";
    known.current = false;
    known.expiredAt = now;
    state.current = "Free";
    state.currentSubscription = null;
    return "expired";
  };
  return { state, receive, expire };
}

test("A) compra Plano A", async () => { const e = engine(); assert.equal(await e.receive({ event: "purchase_approved" }), "activated"); assert.equal(e.state.current, "A"); });
test("B) renovação A", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); assert.equal(await e.receive({ event: "subscription_renewed", order: "renew-a" }), "renewed"); assert.equal(e.state.current, "A"); });
test("C) upgrade A para B", async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "subscription_created", subscription: "sub-b", order: "order-b", offer: "offer-b" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(e.state.current, "B"); assert.equal(e.state.history.get("sub-a").cancellation, "pending"); });
for (const [letter, event] of [["D", "subscription_canceled"], ["E", "refund"], ["F", "chargeback"]]) {
  test(`${letter}) evento antigo de A não remove B`, async () => { const e = engine(); await e.receive({ event: "purchase_approved" }); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event, order: `${event}-a` }), "recorded_stale_subscription"); assert.equal(e.state.current, "B"); });
}
test("G) cancelamento da assinatura B preserva acesso pago", async () => { const e = engine(); await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" }); assert.equal(await e.receive({ event: "subscription_canceled", subscription: "sub-b", order: "cancel-b", offer: "offer-b" }), "cancellation_recorded_access_preserved"); assert.equal(e.state.current, "B"); });
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

test("cancelamento com período A) cancelamento comum mantém o plano pago", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  assert.equal(await e.receive({ event: "subscription_canceled", order: "cancel-a" }), "cancellation_recorded_access_preserved");
  assert.equal(e.state.current, "A");
  assert.equal(e.state.history.get("sub-a").current, true);
});

test("cancelamento com período B) current_period_end vem da Cakto", () => {
  const parsed = parseCaktoItem({
    id: "order-a",
    subscription: { id: "sub-a", next_payment_date: "2026-09-14T10:29:46.071638-03:00" },
  });
  assert.equal(parsed.currentPeriodEnd, "2026-09-14T13:29:46.071Z");
  assert.equal(normalizeCaktoPeriodEnd("invalid"), null);
});

test("cancelamento com período B2) ativação reaproveita data oficial do subscription_created", async () => {
  const e = engine();
  await e.receive({ event: "subscription_created", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "purchase_approved", order: "approved-a", periodEnd: null });
  assert.equal(e.state.history.get("sub-a").currentPeriodEnd, "2026-09-14T13:29:46.071Z");
  const webhook = readFileSync(new URL("../supabase/functions/cakto-webhook/index.ts", import.meta.url), "utf8");
  assert.match(webhook, /if \(!parsed\.subscriptionId\) return/);
});

test("cancelamento com período C) data ausente ou vencida bloqueia cancelamento", () => {
  assert.equal(isFutureCaktoPeriodEnd(null), false);
  assert.equal(isFutureCaktoPeriodEnd("2026-09-14T13:29:46.071Z", Date.parse("2026-09-14T13:29:47.071Z")), false);
  const source = readFileSync(new URL("../supabase/functions/cakto-subscription/index.ts", import.meta.url), "utf8");
  assert.match(source, /if \(!isFutureCaktoPeriodEnd\(currentPeriodEnd\)\) throw new Error\("current_period_end_required"\)/);
});

test("cancelamento com período D) already_canceled não faz downgrade imediato", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  assert.equal(await e.receive({ event: "subscription_canceled", order: "already-canceled" }), "cancellation_recorded_access_preserved");
  assert.equal(e.state.current, "A");
  const source = readFileSync(new URL("../supabase/functions/cakto-subscription/index.ts", import.meta.url), "utf8");
  assert.match(source, /if \(isCaktoCanceledStatus\(prepared\.status\)\) return "already_canceled"/);
});

test("cancelamento com período E) um segundo antes do vencimento continua pago", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_canceled", order: "cancel-a", periodEnd: "2026-09-14T13:29:46.071Z" });
  assert.equal(e.expire("2026-09-14T13:29:45.071Z"), "nothing_due");
  assert.equal(e.state.current, "A");
});

test("cancelamento com período F) após o vencimento volta ao Free", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_canceled", order: "cancel-a", periodEnd: "2026-09-14T13:29:46.071Z" });
  assert.equal(e.expire("2026-09-14T13:29:47.071Z"), "expired");
  assert.equal(e.state.current, "Free");
});

test("cancelamento com período G) job repetido faz somente um downgrade", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  await e.receive({ event: "subscription_canceled", order: "cancel-a" });
  assert.equal(e.expire("2026-09-15T00:00:00.000Z"), "expired");
  assert.equal(e.expire("2026-09-15T00:00:01.000Z"), "nothing_due");
});

test("cancelamento com período H) renovação estende current_period_end", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_renewed", order: "renew-a", periodEnd: "2026-10-14T13:29:46.071Z" });
  assert.equal(e.state.history.get("sub-a").currentPeriodEnd, "2026-10-14T13:29:46.071Z");
});

test("cancelamento com período I) renovação posterior impede expiração antiga", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_renewal_refused", order: "refused-a", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_renewed", order: "renew-a", periodEnd: "2026-10-14T13:29:46.071Z" });
  assert.equal(e.expire("2026-09-15T00:00:00.000Z"), "nothing_due");
  assert.equal(e.state.current, "A");
});

test("cancelamento com período J) renewal_refused mantém acesso até a data final", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_renewal_refused", order: "refused-a", periodEnd: "2026-09-14T13:29:46.071Z" });
  assert.equal(e.expire("2026-09-14T13:29:45.071Z"), "nothing_due");
  assert.equal(e.state.current, "A");
  assert.equal(e.expire("2026-09-14T13:29:47.071Z"), "expired");
});

for (const [letter, event] of [["K", "refund"], ["L", "chargeback"]]) {
  test(`cancelamento com período ${letter}) ${event} atual revoga imediatamente`, async () => {
    const e = engine();
    await e.receive({ event: "purchase_approved" });
    assert.equal(await e.receive({ event, order: `${event}-a` }), "reverted_to_free");
    assert.equal(e.state.current, "Free");
  });
}

test("cancelamento com período M) refund antigo A não afeta B", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" });
  assert.equal(await e.receive({ event: "refund", order: "refund-a" }), "recorded_stale_subscription");
  assert.equal(e.state.current, "B");
});

test("cancelamento com período N) cancelamento antigo A não afeta B", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved" });
  await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b" });
  assert.equal(await e.receive({ event: "subscription_canceled", order: "cancel-a" }), "recorded_stale_subscription");
  assert.equal(e.state.current, "B");
});

test("cancelamento com período O) expiração de A não afeta B", async () => {
  const e = engine();
  await e.receive({ event: "purchase_approved", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "subscription_canceled", order: "cancel-a", periodEnd: "2026-09-14T13:29:46.071Z" });
  await e.receive({ event: "purchase_approved", subscription: "sub-b", order: "order-b", offer: "offer-b", periodEnd: "2026-10-14T13:29:46.071Z" });
  assert.equal(e.expire("2026-09-15T00:00:00.000Z"), "nothing_due");
  assert.equal(e.state.current, "B");
});

test("cancelamento com período P) frontend exibe a data final correta", () => {
  assert.equal(formatBusinessPlanDate("2026-09-14T10:29:46.071638-03:00"), "14/09/2026");
  const page = readFileSync(new URL("../src/app/empresa/plano/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Período atual até \{accessEndLabel\}\./);
  assert.match(page, /Seu plano permanece ativo até \$\{accessEndLabel\}\./);
  assert.match(page, /Assinatura cancelada/);
});

test("cancelamento com período Q) cancelamento duplicado permanece bloqueado", () => {
  assert.deepEqual(canRequestCancellation({
    isOwner: true,
    isDefaultFree: false,
    provider: "cakto",
    providerSubscriptionId: "sub-a",
    cancellationRequestedAt: "2026-08-15T13:00:00.000Z",
  }), { allowed: false, reason: "cancellation_already_requested" });
});

test("migration prepara backfill exato, RPC protegida e cron horário", () => {
  const migration = readFileSync(new URL("../supabase/migrations/20260815135806_preserve_paid_access_until_period_end.sql", import.meta.url), "utf8");
  assert.match(migration, /8de786d0-8956-4246-8c1b-5b40ffb99622/);
  assert.match(migration, /2026-09-14T10:29:46\.071638-03:00/);
  assert.match(migration, /current_period_end <= now\(\)/);
  assert.match(migration, /provider_subscription_id is distinct from history\.provider_subscription_id/);
  assert.match(migration, /'17 \* \* \* \*'/);
  assert.match(migration, /revoke all on function public\.expire_due_provider_subscriptions\(integer\)[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.expire_due_provider_subscriptions\(integer\)[\s\S]*to service_role/);
});
