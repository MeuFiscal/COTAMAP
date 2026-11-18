"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { BusinessLogo } from "@/components/business-logo";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { respondToQuotation, updateEmployeePresence } from "@/services/business/business-service";

const HEARTBEAT_MAX_AGE_MS = 3 * 60 * 1000;
type IncomingCall = { id: string; requestId: string | null; businessId: string };

function hasRecentHeartbeat(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const age = Date.now() - timestamp;
  return age >= -30_000 && age <= HEARTBEAT_MAX_AGE_MS;
}

function brazilGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function BusinessShell({ children, dashboard = false, dashboardGreeting }: { children: ReactNode; dashboard?: boolean; dashboardGreeting?: string }) {
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
    if (!operator?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalStatus(null);
      return;
    }
    let cancelled = false;
    const sync = async () => {
      const { data } = await createClient()
        .from("business_employees")
        .select("presence_status,last_activity_at")
        .eq("id", operator.id)
        .eq("business_id", operator.businessId)
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();
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
  }, [ready, operator, pathname, router]);

  const mutation = useMutation({
    mutationFn: (next: "online" | "offline") => updateEmployeePresence(operator?.id ?? "", next, operator?.businessId),
    onSuccess: (_, next) => {
      setLocalStatus(next);
      setPresenceError(false);
      setLastActivityAt(next === "online" ? new Date().toISOString() : null);
      void client.invalidateQueries({ queryKey: ["business-calls"] });
    },
    onError: () => {
      setPresenceError(true);
      setLocalStatus("offline");
    },
  });
  const availability = useMutation({
    mutationFn: async (next: boolean) => {
      if (!business?.id) throw new Error("Empresa não encontrada.");
      const { error } = await createClient().rpc("set_my_business_availability", { p_is_available: next });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => {
      if (business) setBusiness({ ...business, isAvailableForRequests: next, availabilityUpdatedAt: new Date().toISOString() });
    },
  });

  useEffect(() => {
    if (!operator?.id) return;
    const supabase = createClient();
    const channel = supabase.channel(`presence-${operator.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "business_employees", filter: `id=eq.${operator.id}` }, (payload) => {
        const activity = typeof payload.new.last_activity_at === "string" ? payload.new.last_activity_at : null;
        setLastActivityAt(activity);
        setLocalStatus(payload.new.presence_status === "online" && hasRecentHeartbeat(activity) ? "online" : "offline");
        setPresenceError(false);
      }).subscribe();
    const callsChannel = supabase.channel(`business-call-alerts-${business?.id ?? operator.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "quote_notifications", filter: business?.id ? `business_id=eq.${business.id}` : undefined }, (payload) => {
        const id = typeof payload.new.id === "string" ? payload.new.id : null;
        const businessId = typeof payload.new.business_id === "string" ? payload.new.business_id : business?.id ?? null;
        const requestId = typeof payload.new.quote_request_id === "string" ? payload.new.quote_request_id : null;
        if (id && businessId) {
          setCallQueue((current) => current.some((call) => call.id === id) ? current : [...current, { id, requestId, businessId }]);
          setBannerDismissed(false);
          void client.invalidateQueries({ queryKey: ["business-plan", business?.id] });
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_notifications", filter: business?.id ? `business_id=eq.${business.id}` : undefined }, (payload) => {
        const id = typeof payload.new.id === "string" ? payload.new.id : null;
        const status = String(payload.new.status ?? "");
        if (id && !["pending", "sent"].includes(status)) setCallQueue((current) => current.filter((call) => call.id !== id));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_requests" }, (payload) => {
        const requestId = typeof payload.new.id === "string" ? payload.new.id : null;
        if (requestId) setCallQueue((current) => current.filter((call) => call.requestId !== requestId));
      }).subscribe();
    const businessChannel = business?.id ? supabase.channel(`business-availability-${business.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` }, (payload) => setBusiness({ ...business, isAvailableForRequests: Boolean(payload.new.is_available_for_requests), availabilityUpdatedAt: payload.new.availability_updated_at }))
      .subscribe() : null;
    return () => {
      void supabase.removeChannel(channel);
      void supabase.removeChannel(callsChannel);
      if (businessChannel) void supabase.removeChannel(businessChannel);
    };
  }, [operator?.id, business, setBusiness, client]);

  useEffect(() => {
    if (!currentCall) return;
    playCallAlert();
    const timer = window.setInterval(playCallAlert, 2200);
    return () => window.clearInterval(timer);
  }, [currentCall]);

  const reject = useMutation({
    mutationFn: (call: IncomingCall) => respondToQuotation({ notificationId: call.id, businessId: call.businessId, action: "reject" }),
    onSuccess: async (__, call) => {
      setCallQueue((current) => current.filter((item) => item.id !== call.id));
      setRejectError(null);
      await client.invalidateQueries({ queryKey: ["business-calls"] });
    },
    onError: (error: Error) => setRejectError(error.message.includes("notification") ? "Este chamado já não está disponível." : "Não foi possível recusar este chamado. Tente novamente."),
  });

  const dismissCurrentCall = () => {
    if (!currentCall) return;
    setCallQueue((current) => current.filter((call) => call.id !== currentCall.id));
    setRejectError(null);
  };

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

  if (!ready) return <main className="grid min-h-[100dvh] place-items-center bg-[#F3F4F6]" aria-busy="true"><p className="text-sm font-bold text-black/60">Carregando ambiente da empresa...</p></main>;
  if (!operator && pathname !== "/empresa/operador") return null;

  const firstName = user?.fullName?.split(" ")[0] ?? "sua equipe";
  const roleLabel = operator?.role === "owner" ? "Proprietário" : operator?.role === "manager" ? "Gerente" : "Operador";
  const presenceLabel = presenceError ? "Reconectando presença…" : online ? "Presença ativa" : "Presença pausada";
  const statusControls = <div className="flex flex-wrap items-center gap-2">
    <button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={operator ? online : undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${operator && online ? "bg-emerald-500 text-white shadow-[0_10px_22px_rgba(16,185,129,.24)]" : "bg-white/10 text-white"}`}><span className={`size-2.5 rounded-full ${operator && online ? "bg-emerald-100" : "bg-white/45"}`} />{mutation.isPending ? "Atualizando..." : operator ? online ? "Online" : "Offline" : "Carregando..."}</button>
    <button type="button" disabled={!business || availability.isPending || operator?.role !== "owner"} onClick={() => availability.mutate(!business?.isAvailableForRequests)} aria-pressed={business?.isAvailableForRequests ?? undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${business?.isAvailableForRequests ? "bg-emerald-500 text-white shadow-[0_10px_22px_rgba(16,185,129,.24)]" : "bg-white/10 text-white"}`}><span className={`size-2.5 rounded-full ${business?.isAvailableForRequests ? "bg-emerald-100" : "bg-white/45"}`} />{availability.isPending ? "Atualizando..." : business ? business.isAvailableForRequests ? "Disponível" : "Indisponível" : "Carregando..."}</button>
  </div>;

  const defaultBusinessIdentity = <div className="mb-6 grid gap-4 rounded-3xl border border-[#111827]/10 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <BusinessLogo src={business?.logoUrl} name={business?.name} className="size-14" />
        <div className="min-w-0"><p className="truncate text-lg font-black text-slate-950">{business?.name ?? "Carregando empresa..."}</p><p className="truncate text-sm text-slate-500">{user?.fullName ?? firstName} · {roleLabel}</p></div>
      </div>
      <button type="button" onClick={() => { clearOperator(); router.push("/empresa/operador"); }} className="shrink-0 self-start rounded-full border border-[#F97316]/30 px-3 py-2 text-sm font-black text-[#F97316] sm:ml-auto">Mudar usuário</button>
    </div>
    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
      <button type="button" disabled={!operator || mutation.isPending} onClick={() => mutation.mutate(online ? "offline" : "online")} aria-pressed={operator ? online : undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${operator && online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${operator && online ? "bg-emerald-500" : "bg-slate-400"}`} />{mutation.isPending ? "Atualizando..." : operator ? online ? "Online" : "Offline" : "Carregando..."}</button>
      <button type="button" disabled={!business || availability.isPending || operator?.role !== "owner"} onClick={() => availability.mutate(!business?.isAvailableForRequests)} aria-pressed={business?.isAvailableForRequests ?? undefined} className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${business?.isAvailableForRequests ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}><span className={`size-2.5 rounded-full ${business?.isAvailableForRequests ? "bg-emerald-500" : "bg-slate-400"}`} />{availability.isPending ? "Atualizando..." : business ? business.isAvailableForRequests ? "Disponível" : "Indisponível" : "Carregando..."}</button>
      <span className="ml-auto text-xs font-bold text-slate-400">{presenceLabel}</span>
      {presenceError ? <p role="alert" className="w-full text-sm text-amber-700">Não foi possível confirmar sua presença. Tentando reconectar…</p> : null}
      {availability.error ? <p role="alert" className="w-full text-sm text-red-700">Não foi possível atualizar a disponibilidade da empresa.</p> : null}
    </div>
  </div>;

  const dashboardIdentity = <>
    <section className="relative min-h-[17rem] overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-20 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:min-h-[18rem] sm:px-10 sm:pt-10">
      <div aria-hidden="true" className="absolute inset-0 hidden bg-cover bg-right bg-no-repeat sm:block" style={{ backgroundImage: "url('/images/cotamap-hero-car.webp.png')" }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.98)_0%,rgba(23,23,23,.88)_34%,rgba(23,23,23,.36)_58%,rgba(23,23,23,.06)_100%)] sm:bg-[linear-gradient(90deg,rgba(23,23,23,.96)_0%,rgba(23,23,23,.78)_37%,rgba(23,23,23,.18)_63%,rgba(23,23,23,.04)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
      <div aria-hidden="true" className="absolute -right-12 top-1/2 size-72 -translate-y-1/2 rounded-full border border-orange-300/20" />
      <div aria-hidden="true" className="absolute -right-28 top-1/2 size-[28rem] -translate-y-1/2 rounded-full border border-orange-300/10" />
      <div aria-hidden="true" className="absolute bottom-0 right-[13%] h-40 w-[42%] -skew-x-[28deg] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent blur-2xl" />
      <div className="relative mx-auto max-w-[1440px]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Painel da empresa</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{dashboardGreeting ?? brazilGreeting()},{"\u00A0"}{firstName}! <span aria-hidden="true">👋</span></h1>
        <p className="mt-3 text-base text-white/75 sm:text-lg">Bem-vindo de volta à sua central de cotações.</p>
        <div className="mt-6">{statusControls}</div>
        {presenceError ? <p role="alert" className="mt-4 text-sm font-semibold text-amber-200">Não foi possível confirmar sua presença. Tentando reconectar…</p> : null}
        {availability.error ? <p role="alert" className="mt-4 text-sm font-semibold text-red-200">Não foi possível atualizar a disponibilidade da empresa.</p> : null}
      </div>
    </section>
    <section className="relative z-10 mx-4 -mt-10 mb-6 grid max-w-[1440px] gap-4 rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.13)] sm:mx-6 xl:mx-auto xl:grid-cols-[minmax(0,1.1fr)_minmax(10rem,.75fr)_minmax(10rem,.75fr)_minmax(9rem,.65fr)_auto] xl:items-center xl:px-7">
      <div className="flex min-w-0 items-center gap-4">
        <BusinessLogo src={business?.logoUrl} name={business?.name} className="size-16 sm:size-20" />
        <div className="min-w-0"><p className="truncate text-xl font-black tracking-[-0.04em] text-slate-950 sm:text-2xl">{business?.name ?? "Carregando empresa..."}</p><p className="mt-1 truncate text-sm font-medium text-slate-500">{user?.fullName ?? firstName} · {roleLabel}</p></div>
      </div>
      <div className="flex items-center gap-3 border-l-0 border-slate-100 pl-0 text-sm xl:border-l xl:pl-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500"><Building2 className="size-5" /></span>
        <div><p className="font-black text-slate-800">Empresa selecionada</p><p className="mt-0.5 font-semibold text-slate-500">{presenceLabel}</p></div>
      </div>
      <div className="flex items-center gap-3 border-l-0 border-slate-100 pl-0 text-sm xl:border-l xl:pl-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500"><UsersRound className="size-5" /></span>
        <div><p className="font-black text-slate-800">Operador atual</p><p className={`mt-0.5 font-semibold ${business?.isAvailableForRequests ? "text-emerald-600" : "text-slate-500"}`}>{roleLabel}</p></div>
      </div>
      <div className="flex items-center gap-3 border-l-0 border-slate-100 pl-0 text-sm xl:border-l xl:pl-6">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-orange-50 text-orange-500"><ShieldCheck className="size-5" /></span>
        <div><p className="font-black text-slate-800">Plano</p><p className="mt-0.5 font-semibold text-slate-500">Consulte Meu Plano</p></div>
      </div>
      <div className="flex flex-wrap gap-2 xl:justify-end">
        <button type="button" onClick={() => { clearOperator(); router.push("/empresa/operador"); }} className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-orange-300 hover:text-orange-600">Mudar usuário</button>
        <Link href="/empresa/configuracoes/cadastrais" className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/35 px-4 py-2.5 text-sm font-black text-[#F97316] transition hover:bg-[#FFF7ED]"><ShieldCheck className="size-4" />Editar perfil da empresa</Link>
      </div>
    </section>
  </>;

  return <PrivateShell businessRole={operator?.role} wide={dashboard} dashboard={dashboard}>
    {currentCall && !bannerDismissed ? <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"><span><strong>Novo chamado recebido.</strong> Uma solicitação está aguardando resposta.</span><div className="flex items-center gap-3"><Link href="/empresa/chamados" onClick={dismissCurrentCall} className="font-black underline">Ver chamado</Link><button type="button" aria-label="Fechar aviso" onClick={() => setBannerDismissed(true)} className="text-lg font-bold">×</button></div></div> : null}
    {currentCall ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="new-call-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Novo chamado</p><h2 id="new-call-title" className="mt-2 text-2xl font-black text-slate-950">Uma solicitação aguarda sua resposta</h2></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-700">{callQueue.length > 1 ? `${callQueue.length} na fila` : "Agora"}</span></div><p className="mt-4 text-sm leading-6 text-slate-600">Confira os detalhes do cliente e responda enquanto o chamado estiver disponível.</p>{rejectError ? <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{rejectError}</p> : null}<div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={`/empresa/chamados/${currentCall.id}`} onClick={dismissCurrentCall} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-black uppercase text-white">Ver chamado</Link><button type="button" disabled={reject.isPending} onClick={() => reject.mutate(currentCall)} className="min-h-12 rounded-xl border border-slate-200 px-5 py-3 text-sm font-black uppercase text-slate-700 disabled:opacity-60">{reject.isPending ? "Recusando..." : "Recusar"}</button></div></section></div> : null}
    {dashboard ? dashboardIdentity : defaultBusinessIdentity}
    {children}
  </PrivateShell>;
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
