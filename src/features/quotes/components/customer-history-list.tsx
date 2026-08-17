"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { getCustomerQuoteRequestHistory } from "@/services/customer/customer-service";

const statusLabel: Record<string, string> = {
  waiting: "Em andamento",
  cancelled: "Cancelado",
  finished: "Concluído",
  expired: "Expirado",
  accepted: "Em atendimento",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function CustomerHistoryList() {
  const query = useQuery({ queryKey: ["customer-quote-request-history"], queryFn: getCustomerQuoteRequestHistory, staleTime: 30_000 });
  if (query.isLoading) return <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-black/55">Carregando histórico...</p>;
  if (query.error) return <p role="alert" className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-black/55">Não foi possível carregar seu histórico. Tente novamente.</p>;
  if (!query.data?.length) return <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-black/55">Você ainda não possui solicitações anteriores.</p>;
  return <div className="grid gap-4">{query.data.map((request) => {
    const mainItem = request.items.find((item) => item.position === 1);
    const additionalItems = request.items.filter((item) => item.position > 1);
    const partName = mainItem?.name ?? request.part_name ?? "Peça não informada";
    return <article key={request.id} className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">{partName} × {mainItem?.quantity ?? 1}</h2><p className="mt-1 text-sm text-black/55">{dateFormatter.format(new Date(request.created_at))}</p></div><span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-black text-[#C2410C]">{statusLabel[request.status] ?? "Encerrado"}</span></div>
      {additionalItems.length ? <ul className="mt-4 space-y-1 text-sm text-black/65">{additionalItems.map((item) => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul> : null}
      {(request.vehicle_brand || request.vehicle_model || request.vehicle_year || request.vehicle_engine) ? <p className="mt-4 text-sm text-black/60">Veículo: {[request.vehicle_brand, request.vehicle_model, request.vehicle_year, request.vehicle_engine].filter(Boolean).join(" · ")}</p> : null}
      {request.observation ? <p className="mt-2 text-sm text-black/60">{request.observation}</p> : null}
      <Link href={`/nova-cotacao?request=${encodeURIComponent(request.id)}`} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F97316] px-4 text-sm font-black uppercase text-white">Repetir chamado</Link>
    </article>;
  })}</div>;
}
