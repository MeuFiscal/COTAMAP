"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { getMyOrders } from "@/services/customer/my-orders";
import { useAuth } from "@/hooks/use-auth";

const labels: Record<string, string> = { pending: "Aguardando confirmação", preparing: "Em separação", ready: "Pronto para retirada", completed: "Concluído", cancelled: "Encerrado" };

export default function MyOrdersPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const query = useQuery({ queryKey: ["my-orders", userId], queryFn: () => getMyOrders(undefined, userId), enabled: Boolean(userId) });
  return <PrivateShell>
    <header className="rounded-3xl bg-[#171717] p-8 text-white"><p className="text-xs font-black uppercase tracking-widest text-orange-400">Minha jornada</p><h1 className="mt-3 text-4xl font-black">Meus pedidos</h1></header>
    {query.isLoading ? <p className="mt-6">Carregando pedidos...</p> : query.error ? <p role="alert" className="mt-6 text-red-700">Não foi possível carregar seus pedidos.</p> : !query.data?.length ? <p className="mt-6 rounded-3xl bg-white p-8 text-center">Você ainda não possui pedidos.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{query.data.map((order) => <article key={order.id} className="rounded-3xl bg-white p-6 shadow-sm"><p className="text-xs text-slate-500">Pedido {order.id}</p><h2 className="mt-2 text-xl font-black">{order.quotation?.business?.name ?? "Empresa"}</h2><p className="mt-2 text-sm text-slate-500">{new Date(order.created_at).toLocaleString("pt-BR")} · {labels[order.status] ?? order.status}</p>{order.quotation?.amount != null ? <p className="mt-3 font-bold">{Number(order.quotation.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p> : null}<Link className="mt-4 inline-block font-bold text-orange-600" href={`/pedido/${order.id}`}>Ver detalhes →</Link></article>)}</div>}
  </PrivateShell>;
}
