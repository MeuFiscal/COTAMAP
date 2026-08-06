"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";

import { QuoteField } from "@/features/quotes/components/quote-field";
import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";

type VehicleSectionProps = {
  register: UseFormRegister<NewQuoteFormData>;
  errors: FieldErrors<NewQuoteFormData>;
};

export function VehicleSection({ register, errors }: VehicleSectionProps) {
  return (
    <section aria-labelledby="vehicle-title">
      <div className="mb-5">
        <h2 id="vehicle-title" className="text-lg font-black tracking-[-0.02em]">
          Informações do veículo
        </h2>
        <p className="mt-1 text-sm text-[#111827]/50">Quanto mais preciso, melhor para as lojas.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <QuoteField
            id="vehicleModel"
            label="Modelo do veículo"
            placeholder="Ex.: Honda Civic"
            optional
            error={errors.vehicleModel?.message}
            {...register("vehicleModel")}
          />
        </div>
        <QuoteField
          id="vehicleYear"
          label="Ano"
          inputMode="numeric"
          placeholder="Ex.: 2020"
          optional
          error={errors.vehicleYear?.message}
          {...register("vehicleYear")}
        />
        <div className="sm:col-span-2">
          <QuoteField
            id="vehicleEngine"
            label="Motor"
            placeholder="Ex.: 2.0 Flex"
            optional
            error={errors.vehicleEngine?.message}
            {...register("vehicleEngine")}
          />
        </div>
      </div>
    </section>
  );
}
