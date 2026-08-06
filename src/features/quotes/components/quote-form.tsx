"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { PhotoUploader } from "@/features/quotes/components/photo-uploader";
import { PrimaryButton } from "@/features/quotes/components/primary-button";
import { QuoteField } from "@/features/quotes/components/quote-field";
import { RadiusSelector } from "@/features/quotes/components/radius-selector";
import { VehicleSection } from "@/features/quotes/components/vehicle-section";
import { newQuoteSchema } from "@/features/quotes/schemas/new-quote-schema";
import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";

const initialValues: NewQuoteFormData = {
  partName: "",
  brand: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleEngine: "",
  notes: "",
  radius: 10,
};

export function QuoteForm() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewQuoteFormData>({
    resolver: zodResolver(newQuoteSchema),
    defaultValues: initialValues,
  });

  const submit = handleSubmit(async () => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 650));
    router.push("/procurando-cotacoes");
  });

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
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
            {...register("partName")}
          />
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
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <VehicleSection register={register} errors={errors} />
      </div>

      <div className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8">
        <PhotoUploader onChange={setPhoto} />
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
        <PrimaryButton loading={isSubmitting}>Solicitar cotação</PrimaryButton>
      </div>
    </form>
  );
}
