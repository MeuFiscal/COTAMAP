"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCurrencyInput } from "@/features/quotes/utils/currency";
import { useForm } from "react-hook-form";

import { quotationSchema, type QuotationFormData, type QuotationFormInput } from "@/features/business/schemas/quotation-schema";
import { respondToQuotation } from "@/services/business/business-service";

export function CallResponseForm({ notificationId, businessId }: { notificationId: string; businessId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [photo, setPhoto] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<QuotationFormInput, unknown, QuotationFormData>({ resolver: zodResolver(quotationSchema), defaultValues: { amount: "", availability: "Pronta", notes: "", pickupMinutes: "30" } });
  const mutation = useMutation({ mutationFn: (values: QuotationFormData) => respondToQuotation({ notificationId, businessId, action: "accept", amount: Number(values.amount.replace(/\./g, "").replace(",", ".")), notes: values.notes, availability: values.availability, pickupMinutes: Number(values.pickupMinutes), image: photo }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["business-calls"] }); router.push("/empresa/cotacoes"); }, onError: (error: Error) => setErrorMessage(error.message) });
  return <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-5 rounded-[2rem] bg-[#FFFFFF] p-6 shadow-sm sm:p-8" noValidate>
    {errorMessage ? <p className="rounded-2xl bg-[#F97316]/10 p-4 text-sm font-semibold text-[#9A3412]" role="alert">{errorMessage.includes("notification") ? "Esta solicitação já foi respondida por outro colaborador." : errorMessage}</p> : null}
    <h2 className="text-2xl font-black">Enviar cotação</h2>
    <label className="block text-sm font-bold">Preço<input inputMode="decimal" value={watch("amount")} onChange={(event) => setValue("amount", formatCurrencyInput(event.target.value), { shouldValidate: true })} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" placeholder="R$ 0,00" />{errors.amount ? <span className="text-xs text-[#C2410C]">{errors.amount.message}</span> : null}</label>
    <label className="block text-sm font-bold">Disponibilidade<select {...register("availability")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3"><option>Pronta</option><option>Separando</option><option>Sob encomenda</option></select></label>
    <label className="block text-sm font-bold">Prazo para retirada (minutos)<input type="number" min="1" {...register("pickupMinutes")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" />{errors.pickupMinutes ? <span className="text-xs text-[#C2410C]">{errors.pickupMinutes.message}</span> : null}</label>
    <label className="block text-sm font-bold">Observações<textarea rows={4} {...register("notes")} className="mt-2 w-full rounded-xl border border-[#111827]/10 p-3" /></label>
    <label className="block text-sm font-bold">Foto da peça<input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="mt-2 w-full rounded-xl border border-dashed border-[#111827]/20 p-3 text-sm" /></label>
    <button type="submit" disabled={mutation.isPending} className="min-h-12 w-full rounded-xl bg-[#F97316] px-5 text-sm font-black uppercase text-[#FFFFFF] disabled:opacity-60">{mutation.isPending ? "Enviando..." : "Enviar cotação"}</button>
  </form>;
}
