"use client";

import { useParams } from "next/navigation";
import { Ban, Calendar, CheckCircle2, Circle, MapPin, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { getMyOrderById } from "@/services/customer/my-orders";
import { useAuth } from "@/hooks/use-auth";
import { NavigationActions } from "@/features/location/components/navigation-actions";

const labels: Record<string, string> = {
 pending: "Aguardando confirmação",
 preparing: "Separando",
 ready: "Pronto para retirada",
 completed: "Concluído",
 cancelled: "Pedido encerrado",
};

const statusColors: Record<string, string> = {
 pending: "bg-amber-50 text-amber-700 border-amber-200",
 preparing: "bg-blue-50 text-blue-700 border-blue-200",
 ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
 completed: "bg-slate-100 text-slate-600 border-slate-200",
 cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function OrderPage() {
 const { id } = useParams<{ id: string }>();
 const { session } = useAuth();
 const userId = session?.user.id;
 const query = useQuery({
 queryKey: ["my-order", userId, id],
 queryFn: () => getMyOrderById(id, userId),
 enabled: Boolean(id && userId),
 });
 const order = query.data;

 if (query.isLoading)
 return (
 <PrivateShell>
 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="mt-8 h-96 animate-pulse rounded-[1.75rem] bg-white/70" />
 </div>
 </PrivateShell>
 );

 if (!order)
 return (
 <PrivateShell>
 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">📦</div>
 <p className="mt-4 text-xl font-black text-slate-950">Pedido não encontrado.</p>
 <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
 Este pedido pode ter sido removido ou não pertence à sua conta.
 </p>
 </div>
 </div>
 </PrivateShell>
 );

 const steps: Array<[typeof order.status, string]> = [
 ["pending", "Pedido criado"],
 ["preparing", "Em separação"],
 ["ready", "Pronto para retirada"],
 ["completed", "Pedido concluído"],
 ];
 const current = ["pending", "preparing", "ready", "completed"].indexOf(order.status);
 const business = order.quotation?.business;
 const statusClass = statusColors[order.status] ?? "bg-slate-100 text-slate-600 border-slate-200";

 return (
 <PrivateShell>
 {/* Hero Premium */}
 <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
 <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
 <div className="relative mx-auto max-w-[1440px]">
 <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Detalhes do pedido</p>
 <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
 {business?.name ?? "Empresa não identificada"}
 </h1>
 <p className="mt-3 text-base text-white/75 sm:text-lg">
 {order.quotation?.brand ?? "Peça solicitada"}
 </p>
 </div>
 </section>

 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <article className="-mt-8 rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-8">
 {/* Status Badge */}
 <div className="flex flex-wrap items-center justify-between gap-3">
 <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black ${statusClass}`}>
 {labels[order.status]}
 </span>
 <span className="text-xs font-semibold text-slate-400">
 ID: {order.id.slice(0, 8)}...
 </span>
 </div>

 {/* Valor e Data */}
 <div className="mt-6 grid gap-4 sm:grid-cols-2">
 <div className="rounded-2xl bg-slate-50 p-5">
 <p className="text-xs font-bold text-slate-500">Valor total</p>
 <strong className="mt-1 block text-3xl font-black tracking-[-0.04em] text-[#F97316]">
 R$ {Number(order.quotation?.amount ?? 0).toFixed(2).replace(".", ",")}
 </strong>
 </div>
 <div className="rounded-2xl bg-slate-50 p-5">
 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
 <Calendar className="size-3.5" />
 Criado em
 </div>
 <p className="mt-1 text-lg font-black text-slate-950">
 {new Date(order.created_at).toLocaleDateString("pt-BR", {
 day: "2-digit",
 month: "long",
 year: "numeric",
 })}
 </p>
 <p className="text-sm text-slate-500">
 {new Date(order.created_at).toLocaleTimeString("pt-BR", {
 hour: "2-digit",
 minute: "2-digit",
 })}
 </p>
 </div>
 </div>

 {/* Linha do Tempo */}
 <div className="mt-8">
 <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Linha do tempo</h2>
 <div className="mt-4 space-y-0" aria-label="Linha do tempo do pedido">
 {steps.map(([status, label], index) => {
 const isActive = index <= current;
 const isCurrent = index === current;
 return (
 <div key={status} className="relative flex gap-4 pb-6 last:pb-0">
 {index < steps.length - 1 && (
 <div
 className={`absolute left-[11px] top-8 w-0.5 ${
 isActive ? "bg-[#F97316]" : "bg-slate-200"
 }`}
 style={{ height: "calc(100% - 8px)" }}
 />
 )}
 <div
 className={`relative z-10 grid size-6 shrink-0 place-items-center rounded-full ${
 isActive ? "bg-[#F97316] text-white" : "border-2 border-slate-200 bg-white text-slate-300"
 }`}
 >
 {isActive ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3" />}
 </div>
 <div className="min-w-0 pt-0.5">
 <p
 className={`text-sm font-bold ${
 isCurrent ? "text-[#F97316]" : isActive ? "text-slate-950" : "text-slate-400"
 }`}
 >
 {label}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Observações */}
 {order.quotation?.notes && (
 <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-5">
 <h2 className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Observações</h2>
 <p className="mt-2 leading-relaxed text-slate-600">{order.quotation.notes}</p>
 </div>
 )}

 {/* Ações */}
 <div className="mt-8 space-y-3 border-t border-slate-100 pt-6">
 {business ? (
 <NavigationActions
 name={business.name}
 address={[business.address_line, business.city, business.state].filter(Boolean).join(", ")}
 whatsapp={business.whatsapp}
 latitude={business.latitude}
 longitude={business.longitude}
 />
 ) : null}

 {/* Botão Cancelar Pedido — Desabilitado (Fase 3) */}
 <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
 <div className="flex items-start gap-3">
 <Ban className="mt-0.5 size-5 shrink-0 text-amber-600" />
 <div>
 <p className="font-black text-amber-900">Cancelamento indisponível pelo aplicativo</p>
 <p className="mt-1 text-sm leading-relaxed text-amber-800">
 Para solicitar o cancelamento deste pedido, entre em contato diretamente com a loja{" "}
 <strong>{business?.name ?? "fornecedora"}</strong> pelo WhatsApp ou telefone. O
 cancelamento automático não está disponível para garantir a segurança das operações.
 </p>
 </div>
 </div>
 <button
 type="button"
 disabled
 title="Entre em contato com a loja para solicitar o cancelamento"
 className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-100 px-5 py-3 text-sm font-bold text-amber-400 opacity-60 sm:w-auto"
 >
 <Ban className="size-4" />
 Cancelar pedido
 </button>
 </div>
 </div>
 </article>
 </div>
 </PrivateShell>
 );
}
