"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, MessageSquare } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";

import { BusinessLogo } from "@/components/business-logo";
import { statusLabel } from "@/constants/status-labels";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { useCustomerQuotations } from "@/features/customer/hooks/use-customer-journey";
import { chooseQuotation } from "@/services/customer/customer-service";

const money = (value: number) =>
 `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuoteDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const query = useCustomerQuotations();
 const client = useQueryClient();
 const quote = query.data?.find((item) => item.id === id);
 const mutation = useMutation({
 mutationFn: () => chooseQuotation(id),
 onSuccess: (orderId) => {
 void client.invalidateQueries({ queryKey: ["customer-orders"] });
 router.push(`/pedido/${orderId}`);
 },
 });

 if (query.isLoading)
 return (
 <PrivateShell>
 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="mt-8 h-96 animate-pulse rounded-[1.75rem] bg-white/70" />
 </div>
 </PrivateShell>
 );

 if (!quote)
 return (
 <PrivateShell>
 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">📋</div>
 <p className="mt-4 text-xl font-black text-slate-950">Cotação não encontrada.</p>
 <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
 Esta cotação pode ter expirado ou não pertence à sua conta.
 </p>
 </div>
 </div>
 </PrivateShell>
 );

 const requestItems = new Map(quote.requestItems.map((item) => [item.id, item]));

 return (
 <PrivateShell>
 {/* Hero Premium */}
 <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
 <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
 <div className="relative mx-auto max-w-[1440px]">
 <Link
 href={`/procurando-cotacoes?request=${encodeURIComponent(quote.quote_request_id)}`}
 className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
 >
 <ArrowLeft className="size-4" />
 Voltar para as cotações
 </Link>
 <div className="mt-6 flex flex-wrap items-center gap-4">
 <BusinessLogo src={quote.business?.logo_url} name={quote.business?.name} className="size-16 sm:size-20" />
 <div>
 <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-5xl">
 {quote.business?.name ?? "Empresa não identificada"}
 </h1>
 <p className="mt-2 text-base text-white/75 sm:text-lg">
 {quote.brand ?? "Marca não informada"} · {statusLabel(quote.status)}
 </p>
 </div>
 </div>
 <div className="mt-6 flex flex-wrap items-center gap-4">
 <strong className="text-4xl font-black tracking-[-0.04em] text-[#F97316]">
 {money(quote.amount)}
 </strong>
 {quote.distanceMeters != null && (
 <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
 <MapPin className="size-3.5" />
 {(quote.distanceMeters / 1000).toLocaleString("pt-BR", {
 minimumFractionDigits: 1,
 maximumFractionDigits: 1,
 })}{" "}
 km
 </span>
 )}
 </div>
 </div>
 </section>

 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 {/* Observações */}
 {quote.notes && (
 <div className="-mt-8 mb-6 rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)] sm:p-7">
 <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Observações da empresa</h2>
 <p className="mt-3 leading-relaxed text-slate-600">{quote.notes}</p>
 </div>
 )}

 {/* Itens da Proposta */}
 <article className={`rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-8 ${!quote.notes ? "-mt-8" : ""}`}>
 <div className="flex items-center gap-3">
 <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]">
 <CheckCircle2 className="size-5" />
 </span>
 <div>
 <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Itens da proposta</h2>
 <p className="mt-0.5 text-sm text-slate-500">Confira os detalhes de cada item cotado.</p>
 </div>
 </div>

 <div className="mt-6 space-y-3">
 {quote.items.length ? (
 quote.items.map((item) => {
 const requestItem = requestItems.get(item.quote_request_item_id);
 const quantity = requestItem?.quantity ?? item.quantity_available ?? 1;
 return (
 <div
 key={item.id}
 className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4"
 >
 <div className="min-w-0">
 <p className="truncate font-black text-slate-950">
 {requestItem?.name ?? "Item solicitado"} × {quantity}
 </p>
 <p className="mt-1 text-sm text-slate-500">
 {item.available
 ? `${money(item.unit_price)} por unidade`
 : "Indisponível"}
 </p>
 {item.notes && (
 <p className="mt-1 text-xs text-slate-400">{item.notes}</p>
 )}
 </div>
 <strong className="shrink-0 text-lg font-black tracking-[-0.03em] text-slate-950">
 {item.available ? money(item.unit_price * quantity) : "—"}
 </strong>
 </div>
 );
 })
 ) : (
 <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
 Detalhes dos itens não informados pela empresa.
 </p>
 )}
 </div>
 </article>

 {/* Fotos Enviadas */}
 {quote.requestImages.some((image) => image.url) && (
 <article className="mt-6 rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,.07)] sm:p-8">
 <h2 className="text-xl font-black tracking-[-0.04em] text-slate-950">Fotos enviadas</h2>
 <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
 {quote.requestImages
 .filter((image) => image.url)
 .map((image) => (
 <img
 key={image.id}
 src={image.url}
 alt={image.file_name ?? "Foto da solicitação"}
 className="aspect-square w-full rounded-2xl border border-slate-100 object-cover"
 />
 ))}
 </div>
 </article>
 )}

 {/* Ação Principal */}
 <div className="mt-6">
 <button
 disabled={mutation.isPending || quote.status === "accepted"}
 onClick={() => mutation.mutate()}
 className="w-full rounded-[1.5rem] bg-[#F97316] p-5 text-lg font-black text-white shadow-[0_18px_36px_rgba(249,115,22,.3)] transition hover:-translate-y-0.5 hover:bg-[#EA6800] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
 >
 {mutation.isPending ? "Confirmando..." : "Escolher esta cotação"}
 </button>
 {mutation.error && (
 <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
 Não foi possível escolher esta cotação. Tente novamente.
 </p>
 )}
 </div>
 </div>
 </PrivateShell>
 );
}
