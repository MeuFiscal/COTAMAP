"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { BusinessLogo } from "@/components/business-logo";
import { useCustomerQuotations, useCustomerRequestStatus } from "@/features/customer/hooks/use-customer-journey";

type Sort = "price" | "distance" | "recent";
const statusLabel = (status: string) => ({ pending: "Aguardando resposta", responded: "Respondida", rejected: "Recusada", accepted: "Aceita", cancelled: "Cancelada", expired: "Expirada" }[status] ?? "Em análise");

export function QuoteList({ requestId }: { requestId: string | null }) {
  const query = useCustomerQuotations(requestId ?? undefined);
  const requestStatus = useCustomerRequestStatus(requestId ?? undefined);
  const [sort, setSort] = useState<Sort>("price");
  const [search, setSearch] = useState("");
  const quotes = useMemo(() => [...(query.data ?? [])].filter((quote) => (quote.business?.name ?? "").toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "price" ? Number(a.amount) - Number(b.amount) : sort === "recent" ? b.created_at.localeCompare(a.created_at) : (a.distanceMeters ?? Number.POSITIVE_INFINITY) - (b.distanceMeters ?? Number.POSITIVE_INFINITY)), [query.data, search, sort]);
  if (query.isLoading) return <State text="Carregando cotações..." />;
  if (query.error) return <State text="Não foi possível carregar as cotações." />;
  return <>{requestStatus.data === "cancelled" ? <State text="Chamado cancelado." /> : null}{!quotes.length ? <State text="Nenhuma cotação recebida." /> : <><div className="mb-6 flex flex-wrap gap-3"><input aria-label="Pesquisar empresa" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar empresa" className="rounded-xl border bg-white p-3 text-sm" /><select aria-label="Ordenar cotações" value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="rounded-xl border bg-white p-3 text-sm"><option value="price">Menor preço</option><option value="distance">Menor distância</option><option value="recent">Mais recente</option></select></div><div className="grid gap-4 lg:grid-cols-2">{quotes.map((quote) => { const available = quote.items.filter((item) => item.available).length; const total = quote.requestItems.length || available || 1; return <article key={quote.id} className="rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><BusinessLogo src={quote.business?.logo_url} name={quote.business?.name} className="size-12" /><div className="min-w-0"><h2 className="text-xl font-black">{quote.business?.name ?? "Empresa não identificada"}</h2><p className="mt-1 text-sm text-black/55">{quote.brand ?? "Cotação por itens"} · {statusLabel(quote.status)} · {available} de {total} itens disponíveis{quote.distanceMeters == null ? " · Distância indisponível" : ` · ${(quote.distanceMeters / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`}</p></div></div><strong className="text-xl text-[#F97316]">R$ {Number(quote.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>{quote.requestImages?.[0]?.url ? <img src={quote.requestImages[0].url} alt="Foto enviada pelo cliente" className="mt-4 aspect-[16/7] w-full rounded-2xl object-cover" /> : null}<p className="mt-4 text-sm text-black/60">{quote.notes ?? "Sem observações."}</p><Link href={`/cotacoes/${quote.id}`} className="mt-5 inline-flex rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white">Ver detalhes</Link></article>; })}</div></>}</>;
}

function State({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-black/55">{text}</p>; }
