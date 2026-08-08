"use client";
import Link from "next/link";
import { ArrowRight, Bell, FileText, Package, Plus, Search, Sparkles } from "lucide-react";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { useCustomerOrders, useCustomerQuotations } from "@/features/customer/hooks/use-customer-journey";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const orders = useCustomerOrders();
  const quotations = useCustomerQuotations();
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "você";
  const activeOrders = orders.data?.filter((order) => !["completed", "cancelled"].includes(order.status)).length ?? 0;
  return <PrivateShell>
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">Minha jornada</p><h1 className="mt-2 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Olá, {firstName}.</h1><p className="mt-3 text-lg text-black/55">Encontre a peça certa sem perder tempo.</p></div>
        <Link href="/nova-cotacao" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-5 py-4 font-black text-white shadow-lg shadow-orange-500/20"><Plus className="size-5" />Nova cotação</Link>
      </header>
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo">
        <Link href="/nova-cotacao" className="group rounded-3xl bg-[#111827] p-6 text-white shadow-sm transition hover:-translate-y-1"><Sparkles className="size-6 text-[#FB923C]" /><p className="mt-8 text-xl font-black">Encontrar uma peça</p><p className="mt-1 text-sm text-white/60">Uma solicitação, várias respostas.</p><ArrowRight className="mt-5 size-5 text-[#FB923C] transition group-hover:translate-x-1" /></Link>
        <Link href="/cotacoes" className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1"><FileText className="size-6 text-[#F97316]" /><p className="mt-8 text-3xl font-black">{quotations.data?.length ?? 0}</p><p className="mt-1 text-sm text-black/55">Cotações em andamento</p></Link>
        <div className="rounded-3xl bg-white p-6 shadow-sm"><Package className="size-6 text-[#F97316]" /><p className="mt-8 text-3xl font-black">{activeOrders}</p><p className="mt-1 text-sm text-black/55">Pedidos ativos</p></div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-[#F97316]">Acompanhe de perto</p><h2 className="mt-2 text-2xl font-black">Últimos pedidos</h2></div><Link href="/cotacoes" className="text-sm font-bold text-[#F97316]">Ver cotações</Link></div>{orders.isLoading ? <div className="mt-6 h-28 animate-pulse rounded-2xl bg-[#F3F4F6]" /> : orders.error ? <p role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">Não foi possível carregar seus pedidos.</p> : !orders.data?.length ? <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-[#FAFAFA] p-8 text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-2xl">📦</div><p className="mt-4 font-black">Você ainda não possui pedidos.</p><p className="mx-auto mt-2 max-w-sm text-sm text-black/55">Solicite uma cotação e acompanhe tudo por aqui.</p><Link href="/nova-cotacao" className="mt-5 inline-flex rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white">Solicitar cotação</Link></div> : <div className="mt-6 space-y-3">{orders.data.slice(0, 3).map((order) => <Link key={order.id} href={`/pedido/${order.id}`} className="flex items-center justify-between rounded-2xl bg-[#F8FAFC] p-4 transition hover:bg-orange-50"><div><p className="font-bold">{order.quotation?.business?.name ?? "Empresa"}</p><p className="mt-1 text-sm text-black/55">{order.status}</p></div><ArrowRight className="size-5 text-[#F97316]" /></Link>)}</div>}</div>
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-black uppercase tracking-wider text-[#F97316]">Atalhos rápidos</p><h2 className="mt-2 text-2xl font-black">Tudo em um só lugar</h2><div className="mt-6 grid gap-3"><Link href="/nova-cotacao" className="flex items-center gap-3 rounded-2xl bg-[#FFF7ED] p-4 font-bold"><Search className="size-5 text-[#F97316]" />Solicitar uma peça</Link><Link href="/notificacoes" className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-4 font-bold"><Bell className="size-5 text-[#F97316]" />Ver notificações</Link><Link href="/perfil" className="flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-4 font-bold"><Sparkles className="size-5 text-[#F97316]" />Atualizar meu perfil</Link></div></div>
      </section>
    </div>
  </PrivateShell>;
}
