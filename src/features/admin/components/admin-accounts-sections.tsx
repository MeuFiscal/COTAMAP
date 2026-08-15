"use client";

import { Building2, CalendarDays, MoreHorizontal, UserRound } from "lucide-react";
import type { AdminBusinessSummary, AdminProfileSummary } from "@/services/admin/admin-service";

type Action = (body: Record<string, unknown>) => void;

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function date(value: string | null | undefined, withTime = false) {
  if (!value) return "Não disponível";
  return new Intl.DateTimeFormat("pt-BR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" }).format(new Date(value));
}

function planPrice(plan: AdminBusinessSummary["plan"] | AdminProfileSummary["plan"]) {
  if (!plan) return null;
  return Number(plan.promotional_price ?? plan.price);
}

function subscriptionLabel(subscription: AdminBusinessSummary["subscription"] | AdminProfileSummary["subscription"]) {
  if (!subscription) return "Free";
  if (subscription.cancellation_requested_at) return "Cancelamento solicitado";
  if (subscription.provider_status) return subscription.provider_status;
  return subscription.status;
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "orange" | "blue" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    orange: "bg-orange-50 text-orange-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${tones[tone]}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 px-3 py-2.5"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-bold text-slate-700">{value}</p></div>;
}

function AccountActions({ profile, pending, onAction }: { profile: AdminProfileSummary; pending: boolean; onAction: Action }) {
  const remove = () => {
    const confirmation = window.prompt(`Para excluir definitivamente a conta, digite o e-mail completo:\n${profile.email}`);
    if (confirmation === null) return;
    if (confirmation.trim().toLowerCase() !== profile.email.toLowerCase()) {
      window.alert("O e-mail informado não corresponde à conta selecionada.");
      return;
    }
    onAction({ operation: "delete_profile", profile_id: profile.id, expected_email: confirmation.trim() });
  };

  return <details className="relative">
    <summary aria-label={`Ações de ${profile.full_name}`} className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><MoreHorizontal className="size-5"/></summary>
    <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <button disabled={pending} onClick={() => onAction({ operation: "reset_password", profile_id: profile.id })} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Resetar senha</button>
      <button disabled={pending} onClick={() => onAction({ operation: profile.is_platform_admin ? "remove_admin" : "grant_admin", profile_id: profile.id })} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{profile.is_platform_admin ? "Remover admin" : "Conceder admin"}</button>
      <button disabled={pending} onClick={() => onAction({ operation: profile.is_active ? "deactivate_profile" : "activate_profile", profile_id: profile.id })} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50">{profile.is_active ? "Desativar conta" : "Ativar conta"}</button>
      <div className="my-1 border-t border-slate-100"/>
      <button disabled={pending || profile.has_active_business_membership} onClick={remove} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">Excluir conta</button>
      {profile.has_active_business_membership ? <p className="px-3 pb-2 text-[11px] leading-4 text-slate-400">Remova ou transfira o vínculo empresarial antes da exclusão.</p> : null}
    </div>
  </details>;
}

export function AdminClientsSection({ profiles, pending, error, onAction }: { profiles: AdminProfileSummary[]; pending: boolean; error?: string; onAction: Action }) {
  const typeName = (profile: AdminProfileSummary) => profile.account_type === "admin" ? "Admin" : profile.account_type === "business" ? "Lojista" : "Cliente";
  return <section>
    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Admin / Contas</p>
    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Clientes</h1>
    <p className="mt-2 text-sm text-slate-500">Contas ativas e inativas, vínculos empresariais e dados de assinatura.</p>
    {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Não foi possível concluir a ação: {error}</p> : null}
    <div className="mt-6 grid gap-4 xl:grid-cols-2">{profiles.map((profile) => {
      const price = planPrice(profile.plan);
      return <article key={profile.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><UserRound className="size-5"/></span><div className="min-w-0"><h2 className="truncate text-lg font-black text-slate-950">{profile.full_name || "Sem nome"}</h2><p className="truncate text-sm text-slate-500">{profile.email}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone={profile.is_active ? "green" : "amber"}>{profile.is_active ? "Ativo" : "Inativo"}</Badge><Badge tone={profile.account_type === "admin" ? "orange" : profile.account_type === "business" ? "blue" : "slate"}>{typeName(profile)}</Badge></div></div></div>
          <AccountActions profile={profile} pending={pending} onAction={onAction}/>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Metric label="Cadastro" value={date(profile.created_at)}/>
          <Metric label="Último acesso" value={date(profile.last_access_at, true)}/>
          <Metric label="Empresa" value={profile.business?.name ?? "Sem vínculo"}/>
          <Metric label="Plano" value={profile.plan?.name ?? (profile.business ? "Free" : "Cliente — uso gratuito")}/>
          <Metric label="Assinatura" value={subscriptionLabel(profile.subscription)}/>
          <Metric label="Valor" value={price === null ? "—" : `${money.format(price)}/mês`}/>
        </div>
        {(profile.last_payment_at || profile.subscription?.current_period_end) ? <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold text-slate-500">{profile.last_payment_at ? <span>Último pagamento: {date(profile.last_payment_at)}</span> : null}{profile.subscription?.current_period_end ? <span>Acesso até: {date(profile.subscription.current_period_end)}</span> : null}</div> : null}
      </article>;
    })}</div>
  </section>;
}

export function AdminBusinessesSection({ businesses }: { businesses: AdminBusinessSummary[] }) {
  return <section>
    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">Admin / Operação</p>
    <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Empresas</h1>
    <p className="mt-2 text-sm text-slate-500">Entitlements são informativos e seguem exclusivamente o ciclo real da assinatura.</p>
    <div className="mt-6 grid gap-4 xl:grid-cols-2">{businesses.map((business) => {
      const plan = business.plan;
      const price = planPrice(plan);
      const limit = plan?.is_unlimited ? "Ilimitado" : `${business.used_today} de ${plan?.daily_quote_limit ?? 0}`;
      return <article key={business.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Building2 className="size-5"/></span><div className="min-w-0"><h2 className="truncate text-lg font-black text-slate-950">{business.name}</h2><p className="text-sm text-slate-500">{[business.city, business.state].filter(Boolean).join(" / ") || "Localização não informada"}</p><div className="mt-2 flex flex-wrap gap-2"><Badge tone={business.status === "active" ? "green" : "amber"}>{business.status === "active" ? "Ativa" : "Inativa"}</Badge><Badge tone={plan?.is_default_free || !business.subscription ? "slate" : "orange"}>{plan?.name ?? "Free"}</Badge><Badge tone={business.subscription?.cancellation_requested_at ? "amber" : business.subscription?.provider_status === "paid" ? "green" : "blue"}>{subscriptionLabel(business.subscription)}</Badge></div></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Metric label="Proprietário" value={business.owner?.name ?? "Não informado"}/>
          <Metric label="E-mail" value={business.owner?.email ?? "Não informado"}/>
          <Metric label="Provider" value={business.subscription?.provider ?? "Sem provider"}/>
          <Metric label="Ativação" value={date(business.subscription?.activated_at)}/>
          <Metric label="Uso hoje" value={`${limit} chamados`}/>
          <Metric label="Funcionários" value={business.active_employee_count}/>
        </div>
        <div className="mt-4 grid gap-2 rounded-2xl border border-slate-100 p-4 text-sm sm:grid-cols-3">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Valor do plano</p><p className="mt-1 font-black text-slate-700">{price === null ? "Gratuito" : `${money.format(price)}/mês`}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Último pagamento</p><p className="mt-1 font-black text-slate-700">{date(business.last_payment_at)}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Próxima cobrança / acesso</p><p className="mt-1 flex items-center gap-1.5 font-black text-slate-700"><CalendarDays className="size-4 text-slate-400"/>{date(business.subscription?.current_period_end)}</p></div>
        </div>
      </article>;
    })}</div>
  </section>;
}
