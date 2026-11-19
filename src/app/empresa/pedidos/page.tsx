"use client";

import { ClipboardList, PackageCheck } from "lucide-react";
import Link from "next/link";

import { BusinessShell } from "@/features/business/components/business-shell";
import { useBusinessOrders } from "@/features/business/hooks/use-business-orders";

const columns = [
  { status: "pending", title: "Aguardando separação" },
  { status: "preparing", title: "Separando" },
  { status: "ready", title: "Pronto para retirada" },
  { status: "completed", title: "Concluídos" },
  { status: "cancelled", title: "Cancelados" },
] as const;

export default function BusinessOrdersPage() {
  const query = useBusinessOrders();

  return <BusinessShell>
    <section className="relative overflow-hidden rounded-[2rem] bg-[#171717] p-6 text-white shadow-[0_20px_45px_rgba(23,23,23,.2)] sm:p-8">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(255,107,0,.68),transparent_24%),linear-gradient(120deg,transparent_42%,rgba(255,107,0,.18)_72%,transparent)]" />
      <div className="relative max-w-2xl">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-orange-300"><ClipboardList className="size-4" /> Central de pedidos</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Pedidos da empresa</h1>
        <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">Acompanhe cada pedido no estágio atual de separação e retirada.</p>
      </div>
    </section>

    {query.isLoading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Carregando pedidos">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-44 animate-pulse rounded-[1.5rem] bg-white" />)}</div> : null}
    {query.error ? <p role="alert" className="mt-6 rounded-[1.5rem] border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">Não foi possível carregar os pedidos.</p> : null}
    {!query.isLoading && !query.error && !query.data?.length ? <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center"><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-orange-50 text-orange-500"><PackageCheck className="size-6" /></span><p className="mt-4 font-black text-slate-900">Nenhum pedido disponível.</p><p className="mt-1 text-sm text-slate-500">Os novos pedidos aparecerão aqui quando forem criados.</p></div> : null}
    {query.data?.length ? <section className="mt-6 grid gap-4 lg:grid-cols-5" aria-label="Etapas dos pedidos">
      {columns.map((column) => {
        const orders = query.data.filter((order) => order.status === column.status);
        const isCancelled = column.status === "cancelled";
        return <article key={column.status} className={`min-h-52 rounded-[1.5rem] border p-3 shadow-[0_12px_30px_rgba(15,23,42,.06)] ${isCancelled ? "border-red-100 bg-red-50/40" : "border-white bg-white/60"}`}>
          <header className="flex items-center justify-between gap-3 px-2 py-3"><h2 className={`text-sm font-black uppercase tracking-[.08em] ${isCancelled ? "text-red-700" : "text-slate-700"}`}>{column.title}</h2><span className={`grid size-7 place-items-center rounded-full text-xs font-black ${isCancelled ? "bg-red-100 text-red-700" : "bg-orange-50 text-orange-600"}`}>{orders.length}</span></header>
          <div className="space-y-3">
            {orders.map((order) => <Link key={order.id} href={`/empresa/pedidos/${order.id}`} className={`group block rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isCancelled ? "border-red-100 bg-white hover:border-red-200" : "border-slate-100 bg-white hover:border-orange-200"}`}><p className={`truncate font-black group-hover:text-orange-600 ${isCancelled ? "text-red-900 line-through decoration-red-300" : "text-slate-900"}`}>{order.brand ?? "Peça não informada"}</p><p className="mt-2 text-xl font-black tracking-[-.04em] text-slate-950">R$ {order.amount.toFixed(2).replace(".", ",")}</p><p className="mt-3 border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400">{new Date(order.created_at).toLocaleString("pt-BR")}</p></Link>)}
            {!orders.length ? <p className="rounded-2xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs font-semibold text-slate-400">Nenhum pedido nesta etapa.</p> : null}
          </div>
        </article>;
      })}
    </section> : null}
  </BusinessShell>;
}
