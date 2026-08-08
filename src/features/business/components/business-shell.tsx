"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { updateEmployeePresence } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

export function BusinessShell({ children }: { children: ReactNode }) {
  const { operator, business, setBusiness } = useOperator();
  const client = useQueryClient();
  const [localStatus, setLocalStatus] = useState<"online" | "offline" | null>(null);
  const online = (localStatus ?? (operator?.presenceStatus === "online" ? "online" : "offline")) === "online";
  const mutation = useMutation({ mutationFn: (next: "online" | "offline") => updateEmployeePresence(operator?.id ?? "", next), onSuccess: (_, next) => { setLocalStatus(next); void client.invalidateQueries({ queryKey: ["business-calls"] }); } });
  const availability = useMutation({ mutationFn: async (next: boolean) => {
    if (!business?.id) throw new Error("Empresa não encontrada.");
    const { error } = await createClient().rpc("set_my_business_availability", { target_business_id: business.id, available: next });
    if (error) throw error;
    return next;
  }, onSuccess: (next) => { if (business) setBusiness({ ...business, isAvailableForRequests: next, availabilityUpdatedAt: new Date().toISOString() }); } });

  useEffect(() => {
    if (!operator?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence-${operator.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_employees", filter: `id=eq.${operator.id}` }, (payload) => setLocalStatus(payload.new.presence_status === "online" ? "online" : "offline")).subscribe();
    const businessChannel = business?.id ? supabase.channel(`business-availability-${business.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` }, (payload) => setBusiness({ ...business, isAvailableForRequests: Boolean(payload.new.is_available_for_requests), availabilityUpdatedAt: payload.new.availability_updated_at })) .subscribe() : null;
    return () => { void supabase.removeChannel(channel); if (businessChannel) void supabase.removeChannel(businessChannel); };
  }, [operator?.id, business, setBusiness]);

  return <PrivateShell><div className="mb-6 grid gap-3 rounded-2xl border border-[#111827]/10 bg-white px-4 py-3 text-sm sm:grid-cols-2"><div className="flex flex-wrap items-center justify-between gap-3"><span><span className="font-bold">Operador:</span> {operator?.name ?? "Carregando operador..."}</span><button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={online} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`} />{mutation.isPending ? "Atualizando..." : online ? "Online" : "Offline"}</button></div><div className="flex flex-wrap items-center justify-between gap-3"><span><span className="font-bold">Empresa:</span> {business?.name ?? "Carregando empresa..."}</span><button type="button" disabled={!business || availability.isPending} onClick={() => availability.mutate(!business?.isAvailableForRequests)} aria-pressed={business?.isAvailableForRequests ?? false} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${business?.isAvailableForRequests ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><span className={`size-2.5 rounded-full ${business?.isAvailableForRequests ? "bg-emerald-500" : "bg-red-500"}`} />{availability.isPending ? "Atualizando..." : business?.isAvailableForRequests ? "Disponível" : "Indisponível"}</button></div>{availability.error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">Não foi possível atualizar a disponibilidade da empresa.</p> : null}</div>{children}</PrivateShell>;
}
