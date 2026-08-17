"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { PhotoUploader } from "@/features/quotes/components/photo-uploader";
import { PrimaryButton } from "@/features/quotes/components/primary-button";
import { QuoteField } from "@/features/quotes/components/quote-field";
import { RadiusSelector } from "@/features/quotes/components/radius-selector";
import { VehicleSection } from "@/features/quotes/components/vehicle-section";
import { newQuoteSchema } from "@/features/quotes/schemas/new-quote-schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createRealQuoteRequest, getQuoteRequestDraft } from "@/services/quotes/quote-service";
import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";

const initialValues: NewQuoteFormData = {
  partName: "",
  brand: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleEngine: "",
  notes: "",
  radius: 10,
  items: [{ name: "", brand: "", quantity: 1, unit: "", notes: "" }],
};

export function QuoteForm({ requestId = null }: { requestId?: string | null }) {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [restoredCoordinates, setRestoredCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const restoredRequestId = useRef<string | null>(null);
  const [recentTerms, setRecentTerms] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { const stored = window.localStorage.getItem("cotamap.recent-part-searches"); return stored ? JSON.parse(stored) as string[] : []; } catch { return []; }
  });
  const [showRecentTerms, setShowRecentTerms] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewQuoteFormData>({
    resolver: zodResolver(newQuoteSchema),
    defaultValues: initialValues,
  });
  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({ control, name: "items" });
  const draftQuery = useQuery({
    queryKey: ["quote-request-draft", requestId],
    enabled: Boolean(requestId),
    queryFn: () => getQuoteRequestDraft(requestId as string),
  });
  useEffect(() => {
    if (!requestId || !draftQuery.data || restoredRequestId.current === requestId) return;
    reset(draftQuery.data.values);
    setRestoredCoordinates(draftQuery.data.coordinates);
    restoredRequestId.current = requestId;
  }, [draftQuery.data, requestId, reset]);
  const quoteMutation = useMutation({ mutationFn: ({ values, file, coordinates }: { values: NewQuoteFormData; file: File | null; coordinates: { latitude: number; longitude: number } | null }) => createRealQuoteRequest(values, file, coordinates) });
  const partRegistration = register("partName");

  const submit = handleSubmit(async (values) => {
    const term = values.partName.trim();
    const nextTerms = [term, ...recentTerms.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    setRecentTerms(nextTerms);
    window.localStorage.setItem("cotamap.recent-part-searches", JSON.stringify(nextTerms));
    const normalizedItems = (values.items ?? []).filter((item) => item.name.trim()).map((item) => ({ ...item, quantity: Number(item.quantity) || 1 }));
    const result = await quoteMutation.mutateAsync({ values: { ...values, items: normalizedItems.length ? normalizedItems : [{ name: values.partName, brand: values.brand, quantity: 1, unit: "", notes: values.notes }] }, file: photo, coordinates: restoredCoordinates });
    router.push(`/procurando-cotacoes?request=${encodeURIComponent(result.request.id)}`);
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {draftQuery.isLoading ? <p className="rounded-2xl bg-[#F3F4F6] p-4 text-sm font-semibold" role="status">Restaurando dados do chamado...</p> : null}
      {draftQuery.error ? <p className="rounded-2xl bg-[#F97316]/10 p-4 text-sm font-semibold text-[#9A3412]" role="alert">Não foi possível restaurar este chamado. Verifique se ele pertence à sua conta.</p> : null}
      {draftQuery.data ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F97316]/20 bg-[#FFF7ED] p-4"><p className="text-sm font-semibold text-[#9A3412]">Dados do chamado anterior restaurados. O original não será alterado.</p><button type="button" onClick={() => { restoredRequestId.current = requestId; reset(initialValues); setRestoredCoordinates(null); setPhoto(null); setPhotoInputKey((value) => value + 1); router.replace("/nova-cotacao"); }} className="rounded-xl border border-[#F97316]/30 bg-white px-4 py-2 text-sm font-black text-[#C2410C]">Limpar formulário</button></div> : null}
      {quoteMutation.error ? <p className="rounded-2xl bg-[#F97316]/10 p-4 text-sm font-semibold text-[#9A3412]" role="alert">Não foi possível enviar a solicitação. Tente novamente.</p> : null}
      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-[0_20px_60px_rgba(17,24,39,0.06)] sm:p-8">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#F97316]"
            aria-hidden="true"
          />
          <QuoteField
            id="partName"
            label="Nome da peça *"
            placeholder="O que você está procurando?"
            autoComplete="off"
            className="pl-12"
            error={errors.partName?.message}
            {...partRegistration}
            onFocus={() => setShowRecentTerms(true)}
            onBlur={(event) => { partRegistration.onBlur(event); window.setTimeout(() => setShowRecentTerms(false), 150); }}
          />
          {showRecentTerms && recentTerms.length > 0 ? <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-2xl border border-[#111827]/10 bg-white p-2 shadow-xl" role="listbox" aria-label="Pesquisas recentes"><p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-black/40">Pesquisas recentes</p>{recentTerms.map((term) => <button type="button" key={term} role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => { setShowRecentTerms(false); const input = document.getElementById("partName") as HTMLInputElement | null; if (input) { const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set; setter?.call(input, term); input.dispatchEvent(new Event("input", { bubbles: true })); input.focus(); } }} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold hover:bg-[#FFF7ED]">{term}</button>)}</div> : null}
        </div>
        <div className="mt-5">
          <QuoteField
            id="brand"
            label="Marca"
            placeholder="Ex.: Bosch"
            optional
            error={errors.brand?.message}
            {...register("brand")}
          />
        </div>
        <div className="mt-6 space-y-3" aria-label="Itens adicionais">
          {itemFields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-2xl border border-[#111827]/10 bg-[#FFF7ED] p-3 sm:grid-cols-[1fr_100px_auto]">
            <input {...register(`items.${index}.name`)} placeholder={index === 0 ? "Peça principal (opcional)" : "Outra peça"} className="rounded-xl border border-[#111827]/10 p-3" aria-label={`Nome do item ${index + 1}`} />
            <input type="number" min="1" step="1" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="rounded-xl border border-[#111827]/10 p-3" aria-label={`Quantidade do item ${index + 1}`} />
            {index > 0 ? <button type="button" onClick={() => removeItem(index)} className="rounded-xl border border-[#C2410C]/30 px-3 text-sm font-black text-[#C2410C]">Remover</button> : <span className="hidden sm:block" />}
          </div>)}
          {itemFields.length < 10 ? <button type="button" onClick={() => appendItem({ name: "", brand: "", quantity: 1, unit: "", notes: "" })} className="rounded-xl border border-[#F97316]/40 px-4 py-2 text-sm font-black text-[#C2410C]">+ Adicionar peça</button> : <p className="text-xs font-semibold text-black/50">Limite de 10 itens por chamado.</p>}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <VehicleSection register={register} errors={errors} />
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <PhotoUploader key={photoInputKey} onChange={setPhoto} />
        <span className="sr-only" aria-live="polite">
          {photo ? "Foto selecionada" : "Nenhuma foto selecionada"}
        </span>
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <Controller
          name="radius"
          control={control}
          render={({ field }) => (
            <RadiusSelector
              value={field.value}
              onChange={field.onChange}
              error={errors.radius?.message}
            />
          )}
        />
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label htmlFor="notes" className="text-sm font-black text-[#111827]">
            Observações
          </label>
          <span className="text-xs text-[#111827]/40">Opcional</span>
        </div>
        <textarea
          id="notes"
          rows={5}
          maxLength={500}
          placeholder="Cor, lado da peça, detalhes ou qualquer informação útil..."
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "notes-error" : "notes-help"}
          className={`w-full resize-y rounded-2xl border bg-[#FFFFFF] px-4 py-4 text-base text-[#111827] transition placeholder:text-[#111827]/30 focus:border-[#F97316] focus:outline-none ${errors.notes ? "border-[#F97316]" : "border-[#111827]/10"}`}
          {...register("notes")}
        />
        {errors.notes ? (
          <p id="notes-error" className="mt-1.5 text-xs font-semibold text-[#C2410C]" role="alert">
            {errors.notes.message}
          </p>
        ) : (
          <p id="notes-help" className="mt-1.5 text-right text-xs text-[#111827]/40">
            Até 500 caracteres
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-4 rounded-[2rem] bg-[#111827] p-5 text-[#FFFFFF] sm:flex-row sm:p-7">
        <div className="hidden sm:block">
          <p className="text-sm font-black">Tudo certo?</p>
          <p className="mt-1 text-xs text-[#FFFFFF]/55">
            Você poderá acompanhar as respostas na próxima tela.
          </p>
        </div>
        <PrimaryButton loading={isSubmitting || quoteMutation.isPending}>Buscar cotações</PrimaryButton>
      </div>
    </form>
  );
}
