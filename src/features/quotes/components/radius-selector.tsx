"use client";

import { MapPin } from "lucide-react";

import { QUOTE_RADIUS_OPTIONS, type QuoteRadius } from "@/features/quotes/types/new-quote";

type RadiusSelectorProps = {
  value: QuoteRadius;
  onChange: (radius: QuoteRadius) => void;
  error?: string;
};

export function RadiusSelector({ value, onChange, error }: RadiusSelectorProps) {
  return (
    <fieldset aria-describedby={error ? "radius-error" : "radius-help"}>
      <legend className="text-lg font-black tracking-[-0.02em]">Raio de busca</legend>
      <p id="radius-help" className="mt-1 text-sm text-[#111827]/50">
        Até onde devemos procurar autopeças próximas?
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUOTE_RADIUS_OPTIONS.map((radius) => {
          const selected = value === radius;
          return (
            <button
              key={radius}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(radius)}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-black transition ${selected ? "border-[#F97316] bg-[#F97316] text-[#FFFFFF] shadow-[0_10px_24px_rgba(249,115,22,0.18)]" : "border-[#111827]/10 bg-[#FFFFFF] text-[#111827] hover:border-[#F97316]"}`}
            >
              <MapPin className="size-4" aria-hidden="true" />
              {radius} km
            </button>
          );
        })}
      </div>
      {error ? (
        <p id="radius-error" className="mt-2 text-xs font-semibold text-[#C2410C]" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
