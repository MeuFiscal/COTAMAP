"use client";

import { Check, Crown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { BusinessShell } from "@/features/business/components/business-shell";
import { useBusinessPlan, useCancelBusinessPlan } from "@/features/saas/hooks/use-business-plan";
import { formatBusinessPlanDate } from "@/services/saas/plan-lifecycle";
import type { SaasPlan } from "@/services/saas/plan-service";
import { isPlanUpgrade } from "@/services/saas/plan-ranking";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function activePromotion(plan: SaasPlan): boolean {
  const now = Date.now();
  return plan.promotional_price !== null
    && (!plan.promotion_starts_at || new Date(plan.promotion_starts_at).getTime() <= now)
    && (!plan.promotion_ends_at || new Date(plan.promotion_ends_at).getTime() >= now);
}

function PlanPrice({ plan }: { plan: SaasPlan }) {
  const promotion = activePromotion(plan);
  return <div className="mt-5">
    {promotion ? <p className="text-sm text-slate-400 line-through">{money.format(Number(plan.price))}</p> : null}
    <p className="text-3xl font-black tracking-tight text-orange-500">
      {money.format(Number(promotion ? plan.promotional_price : plan.price))}
      <span className="text-sm font-bold text-slate-400">/mês</span>
    </p>
  </div>;
}

export default function BusinessPlanPage() {
  const query = useBusinessPlan();
  const cancellation = useCancelBusinessPlan();
  const plan = query.data?.plan;
  const unlimited = query.data?.limit === null;
  const cancellationConfirmed = ["canceled", "cancelled"].includes(query.data?.providerStatus?.toLowerCase() ?? "");
  const accessEndLabel = query.data?.currentPeriodEnd
    ? formatBusinessPlanDate(query.data.currentPeriodEnd)
    : null;
  const availablePlans = plan
    ? query.data?.availablePlans.filter((candidate) => isPlanUpgrade(plan.sort_order, candidate.sort_order)) ?? []
    : [];

  const requestCancellation = () => {
    if (!query.data?.businessId || !window.confirm("Deseja solicitar o cancelamento desta assinatura na Cakto?")) return;
    cancellation.mutate(query.data.businessId);
  };

  return <BusinessShell>
    <div className="max-w-5xl">
      <p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Assinatura</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Meu plano</h1>
      {query.isLoading ? <p className="mt-8">Carregando plano...</p>
        : query.error ? <p role="alert" className="mt-8 rounded-2xl bg-red-50 p-5 text-red-700">Não foi possível carregar seu plano.</p>
          : !plan ? <p className="mt-8 rounded-2xl bg-white p-8">Nenhum plano ativo encontrado.</p>
            : <div className="mt-8 space-y-8">
              <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-black text-slate-950">{plan.name}</h2>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                        {cancellationConfirmed ? "Assinatura cancelada" : query.data?.cancellationRequestedAt ? "Cancelamento solicitado" : query.data?.subscriptionStatus === "active" ? "Ativo" : "Gratuito"}
                      </span>
                      {plan.is_default_free ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Plano padrão</span> : null}
                      {query.data?.providerStatus ? <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Cakto: {query.data.providerStatus}</span> : null}
                    </div>
                    <p className="mt-3 max-w-2xl text-slate-500">{plan.description}</p>
                    {accessEndLabel ? <p className="mt-3 text-sm font-semibold text-slate-500">Período atual até {accessEndLabel}.</p> : null}
                    <PlanPrice plan={plan}/>
                  </div>
                  <div className="min-w-56 rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">Uso de hoje</p>
                    <p className="mt-2 text-2xl font-black text-slate-950">{query.data?.usedToday ?? 0}</p>
                    <p className="text-sm font-semibold text-slate-500">{unlimited ? "Chamados ilimitados" : `de ${query.data?.limit ?? 0} chamados`}</p>
                    {!unlimited ? <progress className="mt-4 w-full accent-orange-500" value={query.data?.usedToday ?? 0} max={query.data?.limit ?? 1}/> : null}
                  </div>
                </div>
                <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-8">
                  <h3 className="text-sm font-black text-slate-950">Benefícios e recursos</h3>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    {[...(plan.benefits ?? []), ...(query.data?.features.map((feature) => feature.description) ?? [])]
                      .filter((value, index, all) => all.indexOf(value) === index)
                      .map((benefit) => <li key={benefit} className="flex items-start gap-2 text-sm text-slate-600"><Check className="mt-0.5 size-4 shrink-0 text-orange-500"/>{benefit}</li>)}
                  </ul>
                </div>
              </section>

              {availablePlans.length ? <section>
                <div className="flex items-center gap-3"><Crown className="size-5 text-orange-500"/><h2 className="text-2xl font-black text-slate-950">Outros planos disponíveis</h2></div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">{availablePlans.map((candidate) => {
                  const checkoutAvailable = Boolean(candidate.provider_checkout_url);
                  return <article key={candidate.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-slate-950">{candidate.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{candidate.description}</p>
                    <PlanPrice plan={candidate}/>
                    <p className="mt-3 text-sm font-semibold text-slate-600">{candidate.is_unlimited ? "Chamados ilimitados" : `Até ${candidate.daily_quote_limit ?? 0} chamados por dia`}</p>
                    {checkoutAvailable
                      ? <Link href={`/assinar?plan=${encodeURIComponent(candidate.id)}`} className="mt-5 block rounded-xl bg-orange-500 px-4 py-3 text-center text-sm font-black text-white hover:bg-orange-600">Fazer upgrade</Link>
                      : <p className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-500">Checkout indisponível</p>}
                  </article>;
                })}</div>
              </section> : null}

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-slate-400"/><div><h2 className="font-black text-slate-950">Gerenciar assinatura</h2><p className="mt-1 text-sm text-slate-500">{cancellationConfirmed && accessEndLabel ? `Seu plano permanece ativo até ${accessEndLabel}.` : "O acesso só muda após a confirmação do evento pela Cakto."}</p></div></div>
                  {query.data?.cancellationRequestedAt
                    ? <span className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-700">{cancellationConfirmed ? "Assinatura cancelada" : "Cancelamento solicitado"}</span>
                    : query.data?.canCancel
                      ? <button type="button" onClick={requestCancellation} disabled={cancellation.isPending} className="rounded-xl border border-red-200 px-4 py-3 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50">{cancellation.isPending ? "Solicitando..." : "Cancelar assinatura"}</button>
                      : <p className="text-sm font-semibold text-slate-400">{query.data?.canCancelReason}</p>}
                </div>
                {cancellation.isError ? <p role="alert" className="mt-4 text-sm font-bold text-red-600">Não foi possível solicitar o cancelamento. Nenhuma alteração local de plano foi feita.</p> : null}
              </section>
            </div>}
    </div>
  </BusinessShell>;
}
