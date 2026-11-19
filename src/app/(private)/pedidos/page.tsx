"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { getMyOrders } from "@/services/customer/my-orders";
import { useAuth } from "@/hooks/use-auth";

const labels: Record<string, string> = {
  pending: "Aguardando confirmação",
  preparing: "Em separação",
  ready: "Pronto para retirada",
  completed: "Concluído",
  cancelled: "Encerrado",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  preparing: "bg-blue-50 text-blue-700",
  ready: "bg-emerald-50 text-emerald-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-700",
};

export default function MyOrdersPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const query = useQuery({
    queryKey: ["my-orders", userId],
    queryFn: () => getMyOrders(undefined, userId),
    enabled: Boolean(userId),
  });

  return (
    <PrivateShell>
      {/* Hero Premium */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Minha jornada</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Meus pedidos</h1>
          <p className="mt-3 text-base text-white/75 sm:text-lg">Acompanhe todas as suas solicitações em um só lugar.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {query.isLoading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Carregando pedidos">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-[1.5rem] bg-white/70" />
            ))}
          </div>
        ) : query.error ? (
          <p role="alert" className="mt-6 rounded-[1.5rem] bg-red-50 p-6 text-sm font-semibold text-red-700">
            Não foi possível carregar seus pedidos. Tente novamente.
          </p>
        ) : !query.data?.length ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">📦</div>
            <p className="mt-4 text-xl font-black text-slate-950">Você ainda não possui pedidos.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Solicite uma cotação e acompanhe tudo por aqui.
            </p>
            <Link
              href="/nova-cotacao"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5"
            >
              <Package className="size-4" />
              Solicitar cotação
            </Link>
          </div>
        ) : (
          <div className="-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.map((order) => {
              const statusClass = statusColors[order.status] ?? "bg-slate-100 text-slate-600";
              return (
                <Link
                  key={order.id}
                  href={`/pedido/${order.id}`}
                  className="group relative flex flex-col justify-between rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)] transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_36px_rgba(249,115,22,.12)]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-10 place-items-center rounded-2xl bg-orange-50 text-[#F97316]">
                        <Package className="size-[1.15rem]" aria-hidden="true" />
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusClass}`}>
                        {labels[order.status] ?? order.status}
                      </span>
                    </div>
                    <h2 className="mt-4 truncate text-lg font-black tracking-[-0.03em] text-slate-950">
                      {order.quotation?.business?.name ?? "Empresa"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    {order.quotation?.amount != null ? (
                      <strong className="text-lg font-black tracking-[-0.03em] text-slate-950">
                        {Number(order.quotation.amount).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </strong>
                    ) : (
                      <span className="text-sm font-semibold text-slate-400">Valor pendente</span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-[#F97316] transition group-hover:translate-x-1">
                      Ver detalhes <ArrowRight className="size-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PrivateShell>
  );
}
