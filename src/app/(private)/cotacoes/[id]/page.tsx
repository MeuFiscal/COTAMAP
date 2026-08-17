"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { BusinessLogo } from "@/components/business-logo";
import { statusLabel } from "@/constants/status-labels";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { useCustomerQuotations } from "@/features/customer/hooks/use-customer-journey";
import { chooseQuotation } from "@/services/customer/customer-service";

const money = (value: number) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const query = useCustomerQuotations();
  const client = useQueryClient();
  const quote = query.data?.find((item) => item.id === id);
  const mutation = useMutation({ mutationFn: () => chooseQuotation(id), onSuccess: (orderId) => { void client.invalidateQueries({ queryKey: ["customer-orders"] }); router.push(`/pedido/${orderId}`); } });
  if (query.isLoading) return <PrivateShell><p>Carregando cotação...</p></PrivateShell>;
  if (!quote) return <PrivateShell><p>Cotação não encontrada.</p></PrivateShell>;
  const requestItems = new Map(quote.requestItems.map((item) => [item.id, item]));
  return <PrivateShell><article className="mx-auto max-w-3xl space-y-5"><Link href={`/procurando-cotacoes?request=${encodeURIComponent(quote.quote_request_id)}`} className="inline-flex text-sm font-black text-[#F97316]">← Voltar para as cotações</Link><section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-3"><BusinessLogo src={quote.business?.logo_url} name={quote.business?.name} className="size-16" /><div><h1 className="text-3xl font-black">{quote.business?.name ?? "Empresa não identificada"}</h1><p className="mt-1 text-sm text-black/55">{quote.brand ?? "Marca não informada"} · {statusLabel(quote.status)}</p></div></div><div className="text-right"><strong className="block text-3xl text-[#F97316]">{money(quote.amount)}</strong><span className="text-sm text-black/55">{quote.distanceMeters == null ? "Distância indisponível" : `${(quote.distanceMeters / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`}</span></div></div><p className="mt-6 leading-7 text-black/65">{quote.notes ?? "Sem observações."}</p></section><section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black">Itens da proposta</h2><div className="mt-4 divide-y divide-black/10">{quote.items.length ? quote.items.map((item) => { const requestItem = requestItems.get(item.quote_request_item_id); const quantity = requestItem?.quantity ?? item.quantity_available ?? 1; return <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-black">{requestItem?.name ?? "Item solicitado"} × {quantity}</p><p className="text-sm text-black/55">{item.available ? `${money(item.unit_price)} por unidade` : "Indisponível"}</p>{item.notes ? <p className="mt-1 text-sm text-black/55">{item.notes}</p> : null}</div><strong>{item.available ? money(item.unit_price * quantity) : "—"}</strong></div>; }) : <p className="py-4 text-sm text-black/55">Detalhes dos itens não informados.</p>}</div></section>{quote.requestImages.some((image) => image.url) ? <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-black">Fotos enviadas</h2><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{quote.requestImages.filter((image) => image.url).map((image) => <img key={image.id} src={image.url} alt={image.file_name ?? "Foto da solicitação"} className="aspect-square rounded-2xl object-cover" />)}</div></section> : null}<button disabled={mutation.isPending || quote.status === "accepted"} onClick={() => mutation.mutate()} className="w-full rounded-xl bg-[#F97316] p-4 font-black text-white disabled:opacity-50">{mutation.isPending ? "Confirmando..." : "Escolher esta cotação"}</button>{mutation.error ? <p role="alert" className="text-sm text-red-600">Não foi possível escolher esta cotação. Tente novamente.</p> : null}</article></PrivateShell>;
}
