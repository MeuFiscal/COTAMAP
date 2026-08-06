"use client";

import { Clock3, MapPin, Star, TrendingDown } from "lucide-react";

import type { QuoteSort } from "@/features/quotes/comparison/quote-types";

const filters = [
  { value: "price", label: "Menor preço", icon: TrendingDown },
  { value: "distance", label: "Mais próxima", icon: MapPin },
  { value: "rating", label: "Melhor avaliação", icon: Star },
  { value: "pickup", label: "Menor tempo de retirada", icon: Clock3 },
] as const;

export function QuoteFilters({
  value,
  onChange,
}: {
  value: QuoteSort;
  onChange: (value: QuoteSort) => void;
}) {
  return (
    <fieldset>
      <legend className="sr-only">Ordenar cotações</legend>
      <div className="flex snap-x gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {filters.map(({ value: filterValue, label, icon: Icon }) => {
          const selected = value === filterValue;
          return (
            <button
              key={filterValue}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(filterValue)}
              className={`inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-xl border px-4 text-sm font-black transition ${selected ? "border-[#111827] bg-[#111827] text-[#FFFFFF] shadow-sm" : "border-[#111827]/10 bg-[#FFFFFF] text-[#111827]/60 hover:border-[#F97316] hover:text-[#F97316]"}`}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
