"use client";

import Link from "next/link";
import { ArrowRight, Bell, FileText, Package, Plus, Search, Sparkles } from "lucide-react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useCustomerOrders, useCustomerQuotations } from "@/features/customer/hooks/use-customer-journey";
import { useAuth } from "@/hooks/use-auth";

function getClientGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function brazilHour(): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Pendente",
    in_progress: "Em andamento",
    completed: "Concluído",
    cancelled: "Cancelado",
    approved: "Aprovado",
    rejected: "Recusado",
    waiting_payment: "Aguardando pagamento",
    paid: "Pago",
    shipped: "Enviado",
    delivered: "Entregue",
  };
  return map[status] ?? status;
}

export default function DashboardPage() {
  const orders = useCustomerOrders();
  const quotations = useCustomerQuotations();
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "você";
  const activeOrders = orders.data?.filter((order) => !["completed", "cancelled"].includes(order.status)).length ?? 0;
  const greeting = getClientGreeting(brazilHour());

  return (
    <PrivateShell dashboard>
      {/* HERO PREMIUM */}
      <section className="relative min-h-[17rem] overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-20 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:min-h-[18rem] sm:px-10 sm:pt-10">
        <div aria-hidden="true" className="absolute inset-0 hidden bg-cover bg-right bg-no-repeat sm:block" style={{ backgroundImage: "url('/images/cotamap-hero-car.webp.png')" }} />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.98)_0%,rgba(23,23,23,.88)_34%,rgba(23,23,23,.36)_58%,rgba(23,23,23,.06)_100%)] sm:bg-[linear-gradient(90deg,rgba(23,23,23,.96)_0%,rgba(23,23,23,.78)_37%,rgba(23,23,23,.18)_63%,rgba(23,23,23,.04)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
        <div aria-hidden="true" className="absolute -right-12 top-1/2 size-72 -translate-y-1/2 rounded-full border border-orange-300/20" />
        <div aria-hidden="true" className="absolute -right-28 top-1/2 size-[28rem] -translate-y-1/2 rounded-full border border-orange-300/10" />
        <div aria-hidden="true" className="absolute bottom-0 right-[13%] h-40 w-[42%] -skew-x-[28deg] bg-gradient-to-r from-transparent via-orange-400/20 to-transparent blur-2xl" />
        <div className="relative mx-auto max-w-[1440px]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Minha jornada</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">{greeting}, {firstName}! <span aria-hidden="true">👋</span></h1>
          <p className="mt-3 text-base text-white/75 sm:text-lg">Encontre a peça certa sem perder tempo.</p>
          <div className="mt-6">
            <Link href="/nova-cotacao" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F97316] px-6 py-3 text-sm font-black uppercase text-white shadow-[0_12px_28px_rgba(249,115,22,.35)] transition hover:-translate-y-0.5 hover:bg-[#EA6800]">
              <Plus className="size-5" />Nova cotação
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {/* CARDS DO DASHBOARD */}
        <section aria-label="Resumo" className="relative z-10 -mt-10 grid gap-4 sm:grid-cols-3">
          <Link href="/nova-cotacao" className="group min-h-[9.5rem] rounded-[1.5rem] border border-orange-500 bg-gradient-to-br from-[#FF7A00] via-[#FF6500] to-[#E94D00] p-6 text-white shadow-[0_18px_36px_rgba(249,115,22,.3)] transition duration-200 hover:-translate-y-1">
            <span className="grid size-10 place-items-center rounded-2xl bg-white/15 text-white"><Sparkles className="size-[1.15rem]" aria-hidden="true" /></span>
            <p className="mt-4 text-sm font-bold text-white/85">Encontrar uma peça</p>
            <strong className="mt-1 block text-[1.85rem] font-black tracking-[-0.045em]">Uma solicitação, várias respostas.</strong>
            <ArrowRight className="mt-4 size-5 text-white/80 transition group-hover:translate-x-1" />
          </Link>
          <Link href="/cotacoes" className="group min-h-[9.5rem] rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)] transition duration-200 hover:-translate-y-1">
            <span className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><FileText className="size-[1.15rem]" aria-hidden="true" /></span>
            <p className="mt-4 text-sm font-bold text-slate-500">Cotações em andamento</p>
            <strong className="mt-1 block text-[1.85rem] font-black tracking-[-0.045em] text-slate-950">{quotations.data?.length ?? 0}</strong>
          </Link>
          <div className="min-h-[9.5rem] rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)]">
            <span className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><Package className="size-[1.15rem]" aria-hidden="true" /></span>
            <p className="mt-4 text-sm font-bold text-slate-500">Pedidos ativos</p>
            <strong className="mt-1 block text-[1.85rem] font-black tracking-[-0.045em] text-slate-950">{activeOrders}</strong>
          </div>
        </section>

        {/* ÚLTIMOS PEDIDOS + ATALHOS */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <article className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><Package className="size-5" aria-hidden="true" /></span>
                <div>
                  <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Últimos pedidos</h2>
                  <p className="mt-0.5 text-sm text-slate-500">Acompanhe suas solicitações recentes.</p>
                </div>
              </div>
              <Link href="/cotacoes" className="text-sm font-bold text-[#F97316] transition hover:text-[#EA6800]">Ver todas</Link>
            </div>

            {orders.isLoading ? (
              <div className="mt-6 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : orders.error ? (
              <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">Não foi possível carregar seus pedidos.</p>
            ) : !orders.data?.length ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-2xl">📦</div>
                <p className="mt-4 font-black text-slate-950">Você ainda não possui pedidos.</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">Solicite uma cotação e acompanhe tudo por aqui.</p>
                <Link href="/nova-cotacao" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5">Solicitar cotação</Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {orders.data.slice(0, 3).map((order) => (
                  <Link key={order.id} href={`/pedido/${order.id}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-orange-200 hover:bg-orange-50">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{order.quotation?.business?.name ?? "Empresa"}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">{translateStatus(order.status)}</p>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-[#F97316]" />
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><Sparkles className="size-5" aria-hidden="true" /></span>
              <div>
                <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Atalhos rápidos</h2>
                <p className="mt-0.5 text-sm text-slate-500">Tudo em um só lugar.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              <Link href="/nova-cotacao" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-slate-950 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F97316]">
                <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-[#F97316]"><Search className="size-4" /></span>
                Solicitar uma peça
              </Link>
              <Link href="/notificacoes" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-slate-950 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F97316]">
                <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-[#F97316]"><Bell className="size-4" /></span>
                Ver notificações
              </Link>
              <Link href="/perfil" className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 font-bold text-slate-950 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F97316]">
                <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-[#F97316]"><Sparkles className="size-4" /></span>
                Atualizar meu perfil
              </Link>
            </div>
          </article>
        </section>
      </div>
    </PrivateShell>
  );
}
