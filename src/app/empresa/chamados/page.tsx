"use client";

import Link from "next/link";

import { BusinessShell } from "@/features/business/components/business-shell";
import { useBusinessCalls } from "@/features/business/hooks/use-business-calls";

const statusLabel = (status: string) => ({ pending: "Aguardando resposta", responded: "Respondido", rejected: "Recusado", expired: "Expirado" }[status] ?? status);

export default function BusinessCallsPage() {
  const calls = useBusinessCalls();
  return <BusinessShell><header className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Operação</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Chamados recebidos</h1><p className="mt-2 text-[#111827]/55">Solicitações destinadas à sua autopeça em tempo real.</p></header>{calls.isLoading ? <State text="Carregando chamados..." /> : calls.error ? <State text="Não foi possível carregar os chamados." /> : !calls.data?.length ? <State text="Nenhum chamado disponível." /> : <ul className="grid gap-4">{calls.data.map(({ notification, request }) => <li key={notification.id}><Link href={`/empresa/chamados/${notification.id}`} className="group block rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F97316] hover:shadow-lg"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black">{request.part_name ?? request.description}</h2><p className="mt-2 text-sm text-[#111827]/55">{[request.vehicle_brand, request.vehicle_model, request.vehicle_year].filter(Boolean).join(" · ") || "Veículo não informado"}</p></div><span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold">{statusLabel(notification.status)}</span></div><div className="mt-5 flex items-center justify-between gap-4 text-xs font-semibold text-[#111827]/55"><span>{notification.distance_meters ? `${(notification.distance_meters / 1000).toFixed(1)} km` : "Distância indisponível"}</span><span>{new Date(notification.created_at).toLocaleString("pt-BR")}</span></div><span className="mt-4 inline-flex rounded-xl bg-[#F97316]/10 px-3 py-2 text-xs font-black text-[#C2410C]">Abrir chamado →</span></Link></li>)}</ul>}</BusinessShell>;
}

function State({ text }: { text: string }) { return <div className="rounded-[2rem] border border-dashed border-[#111827]/15 bg-[#FFFFFF] p-12 text-center text-sm font-semibold text-[#111827]/55">{text}</div>; }
