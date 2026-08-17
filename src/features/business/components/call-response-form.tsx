"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { quotationSchema, type QuotationFormData, type QuotationFormInput } from "@/features/business/schemas/quotation-schema";
import { respondToQuotation } from "@/services/business/business-service";
import { formatCurrencyInput, parseCurrencyInput } from "@/features/business/utils/currency";

function friendlyQuotationError(error: unknown) { const message = error instanceof Error ? error.message : ""; if (message.includes("notification")) return "Esta solicitação já foi respondida por outro colaborador."; return "Não foi possível enviar a cotação. Tente novamente."; }

type RequestedItem = { id: string; name: string; quantity: number; brand: string | null; unit: string | null; notes: string | null };
export function CallResponseForm({ notificationId, businessId, items = [] }: { notificationId: string; businessId: string; items?: RequestedItem[] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [itemResponses, setItemResponses] = useState(() => items.map((item) => ({ quote_request_item_id: item.id, available: true, unit_price: "", quantity: item.quantity, notes: "" })));
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<QuotationFormInput, unknown, QuotationFormData>({ resolver: zodResolver(quotationSchema), defaultValues: { amount: "", availability: "Pronta", notes: "", pickupMinutes: "30" } });
  const mutation = useMutation({ mutationFn: (values: QuotationFormData) => respondToQuotation({ notificationId, businessId, action: "accept", amount: Number(values.amount), items: items.length ? itemResponses.map((item) => ({ ...item, unit_price: item.available ? parseCurrencyInput(item.unit_price) ?? 0 : 0 })) : undefined, notes: values.notes, availability: values.availability, pickupMinutes: Number(values.pickupMinutes), image: photo }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["business-calls"] }); router.push("/empresa/cotacoes"); }, onError: (error: Error) => setErrorMessage(error.message) });
  const itemTotal = itemResponses.reduce((sum, item) => sum + (item.available ? (parseCurrencyInput(item.unit_price) ?? 0) * Number(item.quantity || 0) : 0), 0);
  const submit = (values: QuotationFormData) => {
    if (items.length && itemResponses.some((item) => item.available && (parseCurrencyInput(item.unit_price) ?? 0) <= 0)) {
      setErrorMessage("Informe um preço maior que zero para cada item disponível.");
      return;
    }
    setErrorMessage(null);
    mutation.mutate(values);
  };
  useEffect(() => { if (items.length) setValue("amount", itemTotal.toFixed(2).replace(".", ","), { shouldValidate: true }); }, [itemTotal, items.length, setValue]);
  return <form onSubmit={handleSubmit(submit)} className="space-y-5 rounded-[2rem] bg-[#FFFFFF] p-6 shadow-sm sm:p-8" noValidate>
    {errorMessage ? <p className="rounded-2xl bg-[#F97316]/10 p-4 text-sm font-semibold text-[#9A3412]" role="alert">{friendlyQuotationError(new Error(errorMessage))}</p> : null}
    <h2 className="text-2xl font-black">Enviar cotação</h2>
    {items.length ? <div className="space-y-3">{items.map((item, index) => <div key={item.id} className="rounded-2xl border border-[#111827]/10 p-4"><div className="flex items-center justify-between gap-3"><span className="font-black">{item.name} × {item.quantity}</span><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={itemResponses[index]?.available ?? false} onChange={(event) => setItemResponses((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, available: event.target.checked, unit_price: event.target.checked ? line.unit_price : "" } : line))} /> Disponível</label></div>{itemResponses[index]?.available ? <input type="text" inputMode="decimal" value={itemResponses[index]?.unit_price ?? ""} onChange={(event) => setItemResponses((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, unit_price: formatCurrencyInput(event.target.value) } : line))} className="mt-3 w-full rounded-xl border border-[#111827]/10 p-3" placeholder="R$ 0,00" aria-label={`Preço unitário de ${item.name}`} /> : null}</div>)}</div> : <label className="block text-sm font-bold">Preço<input inputMode="decimal" value={watch("amount")} onChange={(event) => setValue("amount", formatCurrencyInput(event.target.value), { shouldValidate: true })} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" placeholder="R$ 0,00" />{errors.amount ? <span className="text-xs text-[#C2410C]">{errors.amount.message}</span> : null}</label>}
    {items.length ? <p className="rounded-xl bg-[#FFF7ED] p-3 text-sm font-black">Total calculado: R$ {itemTotal.toFixed(2).replace(".", ",")}</p> : null}
    <label className="block text-sm font-bold">Disponibilidade<select {...register("availability")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3"><option>Pronta</option><option>Separando</option><option>Sob encomenda</option></select></label>
    <label className="block text-sm font-bold">Prazo para retirada (minutos)<input type="number" min="1" {...register("pickupMinutes")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" />{errors.pickupMinutes ? <span className="text-xs text-[#C2410C]">{errors.pickupMinutes.message}</span> : null}</label>
    <label className="block text-sm font-bold">Observações<textarea rows={4} {...register("notes")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" /></label>
    <label className="block text-sm font-bold">Foto da peça<input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="mt-2 w-full rounded-xl border border-dashed border-[#111827]/20 p-3 text-sm" /></label>
    <button type="submit" disabled={mutation.isPending} className="min-h-12 w-full rounded-xl bg-[#F97316] px-5 py-3 text-sm font-black uppercase text-[#FFFFFF] disabled:opacity-60">{mutation.isPending ? "Enviando..." : "Enviar cotação"}</button>
  </form>;
}
