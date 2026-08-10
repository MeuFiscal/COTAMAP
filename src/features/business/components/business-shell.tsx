"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { updateEmployeePresence } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

export function BusinessShell({ children }: { children: ReactNode }) {
  const { operator, business, setBusiness } = useOperator();
  const client = useQueryClient();
  const [localStatus, setLocalStatus] = useState<"online" | "offline" | null>(null);
  const [newCall, setNewCall] = useState<{ id: string } | null>(null);
  const online = operator ? (localStatus ?? (operator.presenceStatus === "online" ? "online" : "offline")) === "online" : false;
  const mutation = useMutation({ mutationFn: (next: "online" | "offline") => updateEmployeePresence(operator?.id ?? "", next), onSuccess: (_, next) => { setLocalStatus(next); void client.invalidateQueries({ queryKey: ["business-calls"] }); } });
  const availability = useMutation({ mutationFn: async (next: boolean) => {
    if (!business?.id) throw new Error("Empresa não encontrada.");
    const { error } = await createClient().rpc("set_my_business_availability", { p_is_available: next });
    if (error) throw error;
    return next;
  }, onSuccess: (next) => { if (business) setBusiness({ ...business, isAvailableForRequests: next, availabilityUpdatedAt: new Date().toISOString() }); } });

  useEffect(() => {
    if (!operator?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence-${operator.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_employees", filter: `id=eq.${operator.id}` }, (payload) => setLocalStatus(payload.new.presence_status === "online" ? "online" : "offline")).subscribe();
    const callsChannel = supabase.channel(`business-call-alerts-${business?.id ?? operator.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "quote_notifications", filter: business?.id ? `business_id=eq.${business.id}` : undefined }, (payload) => { const id = typeof payload.new.id === "string" ? payload.new.id : null; if (id) setNewCall({ id }); }).subscribe();
    const businessChannel = business?.id ? supabase.channel(`business-availability-${business.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` }, (payload) => setBusiness({ ...business, isAvailableForRequests: Boolean(payload.new.is_available_for_requests), availabilityUpdatedAt: payload.new.availability_updated_at })) .subscribe() : null;
    return () => { void supabase.removeChannel(channel); void supabase.removeChannel(callsChannel); if (businessChannel) void supabase.removeChannel(businessChannel); };
  }, [operator?.id, business, setBusiness]);

  useEffect(() => {
    if (!operator?.id || !online) return;
    const timer = window.setInterval(() => {
      void updateEmployeePresence(operator.id, "online").catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [operator?.id, online]);

  return <PrivateShell>{newCall ? <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span><strong>Novo chamado recebido.</strong> Uma solicitação está aguardando resposta.</span><div className="flex items-center gap-3"><Link href="/empresa/chamados" onClick={() => setNewCall(null)} className="font-black underline">Ver chamado</Link><button type="button" aria-label="Fechar aviso" onClick={() => setNewCall(null)} className="text-lg font-bold">×</button></div></div> : null}<div className="mb-6 grid gap-3 rounded-2xl border border-[#111827]/10 bg-white px-4 py-3 text-sm sm:grid-cols-2"><div className="flex flex-wrap items-center justify-between gap-3"><span><span className="font-bold">Operador:</span> {operator?.name ?? "Carregando operador..."}</span><button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={operator ? online : undefined} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${operator && online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${operator && online ? "bg-emerald-500" : "bg-slate-400"}`} />{mutation.isPending ? "Atualizando..." : operator ? online ? "Online" : "Offline" : "Carregando..."}</button></div><div className="flex flex-wrap items-center justify-between gap-3"><span><span className="font-bold">Empresa:</span> {business?.name ?? "Carregando empresa..."}</span><button type="button" disabled={!business || availability.isPending} onClick={() => availability.mutate(!business?.isAvailableForRequests)} aria-pressed={business?.isAvailableForRequests ?? undefined} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${business?.isAvailableForRequests ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><span className={`size-2.5 rounded-full ${business?.isAvailableForRequests ? "bg-emerald-500" : "bg-slate-400"}`} />{availability.isPending ? "Atualizando..." : business ? business.isAvailableForRequests ? "Disponível" : "Indisponível" : "Carregando..."}</button></div>{availability.error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">Não foi possível atualizar a disponibilidade da empresa.</p> : null}</div>{children}</PrivateShell>;
}
