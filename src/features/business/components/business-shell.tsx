"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { updateEmployeePresence } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

export function BusinessShell({ children }: { children: ReactNode }) {
  const { operator } = useOperator();
  const client = useQueryClient();
  const [online, setOnline] = useState(Boolean(operator));
  const mutation = useMutation({ mutationFn: (next: "online" | "offline") => updateEmployeePresence(operator?.id ?? "", next), onSuccess: (_, next) => { setOnline(next === "online"); void client.invalidateQueries({ queryKey: ["business-calls"] }); }, onError: () => setOnline((current) => current) });

  useEffect(() => {
    if (!operator?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence-${operator.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_employees", filter: `id=eq.${operator.id}` }, (payload) => setOnline(payload.new.presence_status === "online")).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [operator?.id]);

  return <PrivateShell><div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#111827]/10 bg-white px-4 py-3 text-sm"><span><span className="font-bold">Operação:</span> {operator?.name ?? "Nenhum operador selecionado"}</span><button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={online} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${online ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><span className={`size-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-red-500"}`} />{mutation.isPending ? "Atualizando..." : online ? "Online" : "Offline"}<span className={`relative ml-1 h-5 w-9 rounded-full ${online ? "bg-emerald-500" : "bg-red-400"}`}><span className={`absolute top-0.5 size-4 rounded-full bg-white transition-transform ${online ? "translate-x-4" : "translate-x-0.5"}`} /></span></button></div>{children}</PrivateShell>;
}
