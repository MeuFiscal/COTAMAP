import { CarFront, MapPin } from "lucide-react";
import Image from "next/image";

import type { QuoteRequestPreview } from "@/features/quotes/search/search-types";

export function RequestSummaryCard({ request }: { request: QuoteRequestPreview }) {
  return (
    <section
      aria-labelledby="request-title"
      className="flex items-center gap-4 rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-4 shadow-sm sm:p-5"
    >
      {request.photoUrl ? (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[#F3F4F6] sm:size-24">
          <Image
            src={request.photoUrl}
            alt="Foto da peça solicitada"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-[#F3F4F6] text-[#F97316] sm:size-24">
          <CarFront className="size-8" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F97316]">
          Sua solicitação
        </p>
        <h1
          id="request-title"
          className="mt-1 truncate text-xl font-black tracking-[-0.025em] sm:text-2xl"
        >
          {request.partName}
        </h1>
        <p className="mt-1 truncate text-sm text-[#111827]/50">{request.vehicle}</p>
      </div>
      <span className="hidden shrink-0 items-center gap-2 rounded-xl bg-[#F3F4F6] px-3 py-2 text-sm font-black sm:flex">
        <MapPin className="size-4 text-[#F97316]" aria-hidden="true" />
        {request.radius} km
      </span>
    </section>
  );
}
