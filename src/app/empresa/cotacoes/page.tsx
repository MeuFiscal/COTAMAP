"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { BusinessShell } from "@/features/business/components/business-shell";
import { getCurrentBusinessId } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

type Period = "today" | "week" | "month";

export default function BusinessQuotationsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["business-quotations"], queryFn: async () => { const businessId = await getCurrentBusinessId(); const { data, error } = await createClient().from("quotations").select("id,quote_request_id,business_id,amount,brand,notes,status,created_at").eq("business_id", businessId).order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const filtered = useMemo(() => { const start = new Date(); if (period === "today") start.setHours(0, 0, 0, 0); else if (period === "week") start.setDate(start.getDate() - 7); else start.setMonth(start.getMonth() - 1); return (query.data ?? []).filter((item) => new Date(item.created_at) >= start && (status === "all" || item.status === status) && (search.trim() === "" || `${item.brand ?? ""} ${item.notes ?? ""}`.toLowerCase().includes(search.toLowerCase()))); }, [period, query.data, search, status]);
  return <BusinessShell><header className="mb-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Operação</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Minhas cotações</h1></header><div className="mb-6 grid gap-3 rounded-2xl bg-[#FFFFFF] p-4 sm:grid-cols-3"><select value={period} onChange={(event) => setPeriod(event.target.value as Period)} className="rounded-xl border border-[#111827]/10 p-3 text-sm font-bold"><option value="today">Hoje</option><option value="week">Semana</option><option value="month">Mês</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[#111827]/10 p-3 text-sm font-bold"><option value="all">Todos os status</option><option value="sent">Enviadas</option><option value="accepted">Aceitas</option><option value="rejected">Recusadas</option><option value="expired">Expiradas</option></select><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar por peça" className="rounded-xl border border-[#111827]/10 p-3 text-sm" /></div>{query.isLoading ? <State text="Carregando cotações..." /> : query.error ? <State text="Não foi possível carregar suas cotações." /> : !filtered.length ? <State text="Nenhuma cotação enviada." /> : <ul className="grid gap-4">{filtered.map((quotation) => <li key={quotation.id} className="rounded-[2rem] bg-[#FFFFFF] p-6 shadow-sm"><div className="flex items-center justify-between gap-4"><strong className="text-xl font-black">R$ {Number(quotation.amount).toFixed(2).replace(".", ",")}</strong><span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold">{quotation.status}</span></div><p className="mt-3 text-sm text-[#111827]/55">{quotation.brand ?? "Marca não informada"} · {quotation.notes ?? "Sem observações"}</p><time className="mt-4 block text-xs font-semibold text-[#111827]/40">{new Date(quotation.created_at).toLocaleString("pt-BR")}</time></li>)}</ul>}</BusinessShell>;
}

function State({ text }: { text: string }) { return <div className="rounded-[2rem] border border-dashed border-[#111827]/15 bg-[#FFFFFF] p-12 text-center text-sm font-semibold text-[#111827]/55">{text}</div>; }
