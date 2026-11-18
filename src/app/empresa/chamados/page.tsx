"use client";

import Link from "next/link";
import { ArrowUpRight, BellRing, Clock3, MapPin, Sparkles } from "lucide-react";
import { BusinessShell } from "@/features/business/components/business-shell";
import { useBusinessCalls } from "@/features/business/hooks/use-business-calls";

const statusLabel = (status: string) => ({ pending: "Aguardando resposta", responded: "Respondido", rejected: "Recusado", expired: "Expirado", cancelled: "Cancelado" }[status] ?? status);
const statusClass = (status: string) => status === "pending" ? "bg-amber-50 text-amber-700" : status === "responded" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";

export default function BusinessCallsPage() {
  const calls = useBusinessCalls();
  return <BusinessShell>
    <header className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#171717] p-6 text-white shadow-[0_20px_45px_rgba(23,23,23,.2)] sm:p-8">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_84%_5%,rgba(255,107,0,.72),transparent_23%),linear-gradient(122deg,transparent_38%,rgba(255,107,0,.22)_68%,transparent)]" />
      <div className="relative"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-orange-300"><Sparkles className="size-4" /> Operação em tempo real</div><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Chamados recebidos</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/70">Veja novas solicitações, responda rápido e transforme oportunidades em vendas.</p></div>
    </header>
    {calls.isLoading ? <State text="Carregando chamados..." /> : calls.error ? <State text="Não foi possível carregar os chamados." /> : !calls.data?.length ? <State text="Nenhum chamado disponível." /> : <ul className="grid gap-4">{calls.data.map(({ notification, request }) => <li key={notification.id}><Link href={`/empresa/chamados/${notification.id}`} className="group block rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_12px_34px_rgba(15,23,42,.07)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_18px_36px_rgba(15,23,42,.12)] sm:p-6"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-600"><BellRing className="size-5" /></span><div className="min-w-0"><h2 className="truncate text-xl font-black tracking-[-.035em] text-slate-900 group-hover:text-orange-600">{request.part_name ?? request.description}</h2><p className="mt-1 text-sm text-slate-500">{[request.vehicle_brand, request.vehicle_model, request.vehicle_year].filter(Boolean).join(" · ") || "Veículo não informado"}</p></div></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${statusClass(notification.status)}`}>{statusLabel(notification.status)}</span></div><div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-orange-500" />{notification.distance_meters ? `${(notification.distance_meters / 1000).toFixed(1)} km` : "Distância indisponível"}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4 text-orange-500" />{new Date(notification.created_at).toLocaleString("pt-BR")}</span><span className="ml-auto inline-flex items-center gap-1 rounded-xl bg-orange-50 px-3 py-2 font-black text-orange-700">Abrir chamado <ArrowUpRight className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span></div></Link></li>)}</ul>}
  </BusinessShell>;
}

function State({ text }: { text: string }) { return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center text-sm font-semibold text-slate-500">{text}</div>; }
