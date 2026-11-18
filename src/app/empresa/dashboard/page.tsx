"use client";

import { BarChart3, CircleDollarSign, ClipboardList, FileText, Package, ShoppingBag, UsersRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { BusinessShell } from "@/features/business/components/business-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { getBusinessDashboard, type DashboardMetric } from "@/services/analytics/dashboard-service";

const metricIcons: Record<string, typeof Package> = {
  "Pedidos ativos": ShoppingBag,
  "Pedidos concluídos": Package,
  "Pedidos hoje": ClipboardList,
  "Pedidos 7 dias": BarChart3,
  "Pedidos 30 dias": BarChart3,
  "Cotações enviadas": FileText,
  "Solicitações recebidas": UsersRound,
  "Faturamento concluído": CircleDollarSign,
};

const premiumMetricOrder = [
  "Solicitações recebidas",
  "Pedidos ativos",
  "Pedidos concluídos",
  "Cotações enviadas",
  "Faturamento concluído",
  "Pedidos hoje",
  "Pedidos 7 dias",
  "Pedidos 30 dias",
];

function metricByLabel(metrics: DashboardMetric[] | undefined, label: string) {
  return metrics?.find((metric) => metric.label === label);
}

function getBusinessGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function brazilHour(): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
}

export default function BusinessDashboardPage() {
  const query = useQuery({ queryKey: ["business-dashboard"], queryFn: getBusinessDashboard, staleTime: 30_000 });
  const { business, operator } = useOperator();
  const greeting = getBusinessGreeting(brazilHour());
  const periodMetrics = [
    metricByLabel(query.data?.metrics, "Pedidos 7 dias"),
    metricByLabel(query.data?.metrics, "Pedidos 30 dias"),
    metricByLabel(query.data?.metrics, "Cotações enviadas"),
  ].filter((metric): metric is DashboardMetric => Boolean(metric));
  const premiumMetrics = query.data?.metrics.map((metric) => metric)
    .sort((first, second) => premiumMetricOrder.indexOf(first.label) - premiumMetricOrder.indexOf(second.label)) ?? [];
  const primaryMetrics = premiumMetrics.slice(0, 5);
  const secondaryMetrics = premiumMetrics.slice(5);

  return (
    <BusinessShell dashboard dashboardGreeting={greeting}>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
      {query.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Carregando indicadores">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-[1.5rem] bg-white/70" />)}</div> : null}
      {query.error ? <p role="alert" className="rounded-[1.5rem] bg-red-50 p-6 text-red-700">Não foi possível carregar o dashboard. Tente novamente.</p> : null}
      {query.data ? <>
        <section aria-label="Indicadores da empresa" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {primaryMetrics.map((metric) => {
            const Icon = metricIcons[metric.label] ?? BarChart3;
            const featured = metric.label === "Solicitações recebidas";
            return <article key={metric.label} className={`group min-h-[9.5rem] rounded-[1.5rem] border p-4 shadow-[0_12px_30px_rgba(15,23,42,.08)] transition duration-200 hover:-translate-y-1 ${featured ? "border-orange-500 bg-gradient-to-br from-[#FF7A00] via-[#FF6500] to-[#E94D00] text-white shadow-[0_18px_36px_rgba(249,115,22,.3)]" : "border-white bg-white text-slate-950"}`}>
              <span className={`grid size-10 place-items-center rounded-2xl ${featured ? "bg-white/15 text-white" : "bg-orange-50 text-[#F97316]"}`}><Icon className="size-[1.15rem]" aria-hidden="true" /></span>
              <p className={`mt-4 text-sm font-bold ${featured ? "text-white/85" : "text-slate-500"}`}>{metric.label}</p>
              <strong className="mt-1 block text-[1.85rem] font-black tracking-[-0.045em]">{metric.value}</strong>
            </article>;
          })}
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.9fr]">
          <article className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-7">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><BarChart3 className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Resumo de Pedidos</h2><p className="mt-0.5 text-sm text-slate-500">Indicadores consolidados da empresa.</p></div></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {secondaryMetrics.map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-bold text-slate-500">{metric.label}</p><strong className="mt-2 block text-2xl font-black tracking-[-0.04em] text-slate-950">{metric.value}</strong></div>)}
            </div>
            {periodMetrics.length ? <p className="mt-5 border-t border-dashed border-slate-200 pt-4 text-xs font-semibold text-slate-400">O gráfico por período aparecerá quando houver histórico temporal disponível.</p> : null}
            {query.data.generatedAt ? <time className="mt-6 block text-xs font-semibold text-slate-400" dateTime={query.data.generatedAt}>Atualizado às {new Date(query.data.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time> : null}
          </article>

          <article className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-7">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><UsersRound className="size-5" aria-hidden="true" /></span><h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Status da empresa</h2></div><span className={`rounded-full px-3 py-1.5 text-xs font-black ${business?.isAvailableForRequests ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{business?.isAvailableForRequests ? "Disponível" : "Indisponível"}</span></div>
            <dl className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-sm font-semibold text-slate-500">Empresa selecionada</dt><dd className="max-w-[12rem] truncate text-right text-sm font-black text-slate-800">{business?.name ?? "Carregando..."}</dd></div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-sm font-semibold text-slate-500">Operador atual</dt><dd className="text-right text-sm font-black capitalize text-slate-800">{operator?.role === "owner" ? "Proprietário" : operator?.role === "manager" ? "Gerente" : "Operador"}</dd></div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2.5"><dt className="text-sm font-semibold text-slate-500">Recebimento de solicitações</dt><dd className={`text-right text-sm font-black ${business?.isAvailableForRequests ? "text-emerald-600" : "text-slate-600"}`}>{business?.isAvailableForRequests ? "Ativado" : "Pausado"}</dd></div>
            </dl>
          </article>
        </section>
      </> : null}
      </div>
    </BusinessShell>
  );
}
