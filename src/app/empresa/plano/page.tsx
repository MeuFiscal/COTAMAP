"use client";
import { BusinessShell } from "@/features/business/components/business-shell";
import { useBusinessPlan } from "@/features/saas/hooks/use-business-plan";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function BusinessPlanPage() {
  const query = useBusinessPlan();
  const plan = query.data?.plan;
  const promotion = !!plan && plan.promotional_price !== null && plan.promotional_price !== undefined &&
    (!plan.promotion_starts_at || new Date(plan.promotion_starts_at) <= new Date()) &&
    (!plan.promotion_ends_at || new Date(plan.promotion_ends_at) >= new Date());
  const unlimited = query.data?.limit === null;

  return <BusinessShell>
    <h1 className="text-4xl font-black">Meu plano</h1>
    {query.isLoading ? <p className="mt-8">Carregando plano...</p> :
      query.error ? <p role="alert" className="mt-8 text-red-600">Não foi possível carregar seu plano.</p> :
      !plan ? <p className="mt-8 rounded-2xl bg-white p-8">Nenhuma assinatura ativa encontrada.</p> :
      <div className="mt-8 max-w-2xl space-y-5">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">{plan.name}</h2>
            <span className="rounded-full bg-[#F97316] px-3 py-1 text-xs font-black text-white">
              {plan.code === "premium" ? "Premium" : "Free"}
            </span>
          </div>
          <p className="mt-2 text-black/60">{plan.description}</p>
          <p className="mt-5 text-sm">
            Chamados utilizados hoje: <strong>{query.data?.usedToday ?? 0}</strong>
            {unlimited ? <span className="ml-2 font-bold text-[#F97316]">• Ilimitado</span> : <span> de {query.data?.limit ?? 0}</span>}
          </p>
          {!unlimited && <progress className="mt-3 w-full" value={query.data?.usedToday ?? 0} max={query.data?.limit ?? 1} />}
          <div className="mt-6">
            {promotion ? <><del className="text-black/45">{money.format(Number(plan.price))}</del> <strong className="ml-2 text-2xl text-[#F97316]">{money.format(Number(plan.promotional_price))}</strong></> :
              <strong className="text-2xl text-[#F97316]">{money.format(Number(plan.price))}</strong>}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Recursos disponíveis</h2>
          <ul className="mt-4 space-y-2">{query.data?.features.map((feature) => <li key={feature.key}>✓ {feature.description}</li>)}</ul>
        </section>
        {plan.code === "free" ? query.data?.checkout ? <a href={query.data.checkout.url} target="_blank" rel="noreferrer" className="block rounded-xl bg-[#F97316] p-4 text-center font-black text-white">✨ Tornar-se Premium</a> : <p className="rounded-xl bg-[#F3F4F6] p-4 text-sm">Checkout Premium indisponível no momento.</p> : null}
      </div>}
  </BusinessShell>;
}
