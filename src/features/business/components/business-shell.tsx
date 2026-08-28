"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { respondToQuotation, updateEmployeePresence } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";
import { BusinessLogo } from "@/components/business-logo";
import { useAuth } from "@/hooks/use-auth";

const HEARTBEAT_MAX_AGE_MS = 3 * 60 * 1000;
type IncomingCall = { id: string; requestId: string | null; businessId: string };

function hasRecentHeartbeat(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= -30_000 && age <= HEARTBEAT_MAX_AGE_MS;
}

export function BusinessShell({ children }: { children: ReactNode }) {
  const { ready, operator, business, setBusiness, clearOperator } = useOperator();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [localStatus, setLocalStatus] = useState<"online" | "offline" | null>(null);
  const [presenceError, setPresenceError] = useState(false);
  const [lastActivityAt, setLastActivityAt] = useState<string | null>(null);
  const [callQueue, setCallQueue] = useState<IncomingCall[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const currentCall = callQueue[0] ?? null;
  const online = operator ? localStatus === "online" && !presenceError && hasRecentHeartbeat(lastActivityAt) : false;

  // Sempre sincroniza o operador selecionado com o banco ao trocar de tela/recarregar.
  useEffect(() => {
    if (!operator?.id) { // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalStatus(null); return;
    }
    let cancelled = false;
    const sync = async () => {
      const { data } = await createClient().from("business_employees").select("presence_status,last_activity_at").eq("id", operator.id).eq("business_id", operator.businessId).eq("is_active", true).is("deleted_at", null).maybeSingle();
      if (!cancelled) {
        const activity = typeof data?.last_activity_at === "string" ? data.last_activity_at : null;
        setLastActivityAt(activity);
        setLocalStatus(data?.presence_status === "online" && hasRecentHeartbeat(activity) ? "online" : "offline");
        setPresenceError(false);
      }
    };
    void sync();
    return () => { cancelled = true; };
  }, [operator?.id, operator?.businessId]);

  useEffect(() => {
    if (ready && !operator && pathname !== "/empresa/operador") router.replace("/empresa/operador");
  }, [operator, pathname, router]);

  const mutation = useMutation({ mutationFn: (next: "online" | "offline") => updateEmployeePresence(operator?.id ?? "", next, operator?.businessId), onSuccess: (_, next) => { setLocalStatus(next); setPresenceError(false); setLastActivityAt(next === "online" ? new Date().toISOString() : null); void client.invalidateQueries({ queryKey: ["business-calls"] }); }, onError: () => { setPresenceError(true); setLocalStatus("offline"); } });
  const availability = useMutation({ mutationFn: async (next: boolean) => { if (!business?.id) throw new Error("Empresa não encontrada."); const { error } = await createClient().rpc("set_my_business_availability", { p_is_available: next }); if (error) throw error; return next; }, onSuccess: (next) => { if (business) setBusiness({ ...business, isAvailableForRequests: next, availabilityUpdatedAt: new Date().toISOString() }); } });

  useEffect(() => { if (!operator?.id) return; const supabase = createClient(); const channel = supabase.channel(`presence-${operator.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_employees", filter: `id=eq.${operator.id}` }, (payload) => { const activity = typeof payload.new.last_activity_at === "string" ? payload.new.last_activity_at : null; setLastActivityAt(activity); setLocalStatus(payload.new.presence_status === "online" && hasRecentHeartbeat(activity) ? "online" : "offline"); setPresenceError(false); }).subscribe(); const callsChannel = supabase.channel(`business-call-alerts-${business?.id ?? operator.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "quote_notifications", filter: business?.id ? `business_id=eq.${business.id}` : undefined }, (payload) => { const id = typeof payload.new.id === "string" ? payload.new.id : null; const businessId = typeof payload.new.business_id === "string" ? payload.new.business_id : business?.id ?? null; const requestId = typeof payload.new.quote_request_id === "string" ? payload.new.quote_request_id : null; if (id && businessId) { setCallQueue((current) => current.some((call) => call.id === id) ? current : [...current, { id, requestId, businessId }]); setBannerDismissed(false); void client.invalidateQueries({ queryKey: ["business-plan", business?.id] }); } }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_notifications", filter: business?.id ? `business_id=eq.${business.id}` : undefined }, (payload) => { const id = typeof payload.new.id === "string" ? payload.new.id : null; const status = String(payload.new.status ?? ""); if (id && !["pending", "sent"].includes(status)) setCallQueue((current) => current.filter((call) => call.id !== id)); }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_requests" }, (payload) => { const requestId = typeof payload.new.id === "string" ? payload.new.id : null; if (requestId) setCallQueue((current) => current.filter((call) => call.requestId !== requestId)); }).subscribe(); const businessChannel = business?.id ? supabase.channel(`business-availability-${business.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` }, (payload) => setBusiness({ ...business, isAvailableForRequests: Boolean(payload.new.is_available_for_requests), availabilityUpdatedAt: payload.new.availability_updated_at })).subscribe() : null; return () => { void supabase.removeChannel(channel); void supabase.removeChannel(callsChannel); if (businessChannel) void supabase.removeChannel(businessChannel); }; }, [operator?.id, business, setBusiness, client]);

  useEffect(() => {
    if (!currentCall) return;
    playCallAlert();
    const timer = window.setInterval(playCallAlert, 2200);
    return () => window.clearInterval(timer);
  }, [currentCall]);

  const reject = useMutation({ mutationFn: (call: IncomingCall) => respondToQuotation({ notificationId: call.id, businessId: call.businessId, action: "reject" }), onSuccess: async (__, call) => { setCallQueue((current) => current.filter((item) => item.id !== call.id)); setRejectError(null); await client.invalidateQueries({ queryKey: ["business-calls"] }); }, onError: (error: Error) => setRejectError(error.message.includes("notification") ? "Este chamado já não está disponível." : "Não foi possível recusar este chamado. Tente novamente.") });

  const dismissCurrentCall = () => { if (!currentCall) return; setCallQueue((current) => current.filter((call) => call.id !== currentCall.id)); setRejectError(null); };

  useEffect(() => {
    if (!operator?.id || !operator.businessId) return;
    let cancelled = false;
    const heartbeat = async () => {
      try {
        await updateEmployeePresence(operator.id, "online", operator.businessId);
        if (cancelled) return;
        setLocalStatus("online");
        setPresenceError(false);
        setLastActivityAt(new Date().toISOString());
      } catch {
        if (cancelled) return;
        setLocalStatus("offline");
        setPresenceError(true);
      }
    };
    void heartbeat();
    const timer = window.setInterval(() => void heartbeat(), 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [operator?.id, operator?.businessId]);

  if (!ready || (!operator && pathname !== "/empresa/operador")) return null;
  const firstName = user?.fullName?.split(" ")[0] ?? "sua equipe";
  const presenceLabel = presenceError ? "Reconectando presença…" : online ? "Presença ativa" : "Presença pausada";
  return <PrivateShell businessRole={operator?.role}>{currentCall && !bannerDismissed ? <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span><strong>Novo chamado recebido.</strong> Uma solicitação está aguardando resposta.</span><div className="flex items-center gap-3"><Link href="/empresa/chamados" onClick={dismissCurrentCall} className="font-black underline">Ver chamado</Link><button type="button" aria-label="Fechar aviso" onClick={() => setBannerDismissed(true)} className="text-lg font-bold">×</button></div></div> : null}{currentCall ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="new-call-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Novo chamado</p><h2 id="new-call-title" className="mt-2 text-2xl font-black text-slate-950">Uma solicitação aguarda sua resposta</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{callQueue.length > 1 ? `${callQueue.length} na fila` : "Agora"}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">Confira os detalhes do cliente e responda enquanto o chamado estiver disponível.</p>{rejectError ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{rejectError}</p> : null}<div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/empresa/chamados/${currentCall.id}`} onClick={dismissCurrentCall} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-white">Ver chamado</Link><button type="button" disabled={reject.isPending} onClick={() => reject.mutate(currentCall)} className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-sm font-black uppercase text-slate-700 disabled:opacity-60">{reject.isPending ? "Recusando..." : "Recusar"}</button></div></section></div> : null}<div className="mb-6 grid gap-4 rounded-3xl border border-[#111827]/10 bg-white p-4 shadow-sm sm:p-5"><div className="flex min-w-0 items-center gap-3"><BusinessLogo src={business?.logoUrl} name={business?.name} className="size-14"/><div className="min-w-0"><p className="truncate text-lg font-black text-slate-950">{business?.name ?? "Carregando empresa..."}</p><p className="truncate text-sm text-slate-500">{user?.fullName ?? firstName} · {operator?.role === "owner" ? "Proprietário" : operator?.role === "manager" ? "Gerente" : "Operador"}</p></div><button type="button" onClick={() => { clearOperator(); router.push("/empresa/operador"); }} className="ml-auto shrink-0 rounded-full border border-[#F97316]/30 px-3 py-2 text-sm font-black text-[#F97316]">Mudar usuário</button></div><div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"><button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={operator ? online : undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${operator && online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${operator && online ? "bg-emerald-500" : "bg-slate-400"}`} />{mutation.isPending ? "Atualizando..." : operator ? online ? "Online" : "Offline" : "Carregando..."}</button><button type="button" disabled={!business || availability.isPending || operator?.role !== "owner"} onClick={() => availability.mutate(!business?.isAvailableForRequests)} aria-pressed={business?.isAvailableForRequests ?? undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${business?.isAvailableForRequests ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${business?.isAvailableForRequests ? "bg-emerald-500" : "bg-slate-400"}`} />{availability.isPending ? "Atualizando..." : business ? business.isAvailableForRequests ? "Disponível" : "Indisponível" : "Carregando..."}</button><span className="ml-auto text-xs font-bold text-slate-400">{presenceLabel}</span>{presenceError ? <p role="alert" className="w-full text-sm text-amber-700">Não foi possível confirmar sua presença. Tentando reconectar…</p> : null}{availability.error ? <p role="alert" className="w-full text-sm text-red-700">Não foi possível atualizar a disponibilidade da empresa.</p> : null}</div></div>{children}</PrivateShell>;
}
const playCallAlert = () => {
  try {
    const AudioContextClass = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const now = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    gain.connect(context.destination);
    [880, 660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const start = now + index * 0.22;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
    window.setTimeout(() => void context.close(), 1200);
  } catch {
    // O navegador pode bloquear áudio até uma interação do operador.
  }
};
