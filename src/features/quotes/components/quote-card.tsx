"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock3, Heart, MapPin, PackageCheck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { BusinessBadge } from "@/features/quotes/components/business-badge";
import { PriceHighlight } from "@/features/quotes/components/price-highlight";
import { QuoteDetails } from "@/features/quotes/components/quote-details";
import type { QuoteComparison } from "@/features/quotes/comparison/quote-types";

export function QuoteCard({
  quote,
  favorite,
  onFavorite,
}: {
  quote: QuoteComparison;
  favorite: boolean;
  onFavorite: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42 }}
      className="overflow-hidden rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] shadow-[0_18px_50px_rgba(17,24,39,0.06)] transition-shadow hover:shadow-[0_24px_60px_rgba(17,24,39,0.1)]"
    >
      <div className="relative h-44 overflow-hidden bg-[#F3F4F6]">
        <Image
          src="/og.png"
          alt={`Foto ilustrativa da peça cotada pela ${quote.businessName}`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          style={{ objectPosition: quote.imagePosition }}
        />
        <span className="absolute left-4 top-4 rounded-xl bg-[#FFFFFF]/95 px-3 py-2 text-xs font-black text-[#111827] shadow-sm backdrop-blur-sm">
          {quote.status}
        </span>
        <button
          type="button"
          onClick={onFavorite}
          aria-pressed={favorite}
          aria-label={`${favorite ? "Remover" : "Adicionar"} ${quote.businessName} dos favoritos`}
          className={`absolute right-4 top-4 grid size-11 place-items-center rounded-xl shadow-sm backdrop-blur-sm transition ${favorite ? "bg-[#F97316] text-[#FFFFFF]" : "bg-[#FFFFFF]/95 text-[#111827] hover:text-[#F97316]"}`}
        >
          <Heart className={`size-5 ${favorite ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="p-5 sm:p-6">
        <BusinessBadge
          name={quote.businessName}
          initials={quote.businessInitials}
          rating={quote.rating}
          reviews={quote.reviewCount}
          score={quote.cotamapScore}
        />

        <div className="mt-6 flex items-end justify-between gap-4">
          <PriceHighlight value={quote.price} />
          <span className="rounded-xl bg-[#F97316]/10 px-3 py-2 text-xs font-black text-[#F97316]">
            {quote.brand}
          </span>
        </div>
        <p className="mt-4 min-h-12 text-sm leading-6 text-[#111827]/55">{quote.note}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric icon={MapPin} label="Distância" value={`${quote.distanceKm.toFixed(1)} km`} />
          <Metric icon={Clock3} label="Retirada" value={quote.pickupLabel} />
          <Metric icon={PackageCheck} label="Resposta" value={`${quote.responseMinutes} min`} />
        </div>

        <AnimatePresence initial={false}>
          {detailsOpen ? <QuoteDetails quote={quote} /> : null}
        </AnimatePresence>

        <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            type="button"
            onClick={() => setSelected(true)}
            disabled={selected}
            className={`min-h-12 rounded-xl px-5 text-sm font-black uppercase tracking-[0.05em] transition ${selected ? "bg-[#111827] text-[#FFFFFF]" : "bg-[#F97316] text-[#FFFFFF] hover:bg-[#111827]"}`}
          >
            {selected ? "Cotação selecionada" : "Escolher esta cotação"}
          </button>
          <button
            type="button"
            onClick={() => setDetailsOpen((current) => !current)}
            aria-expanded={detailsOpen}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#111827]/10 px-4 text-sm font-black transition hover:border-[#F97316] hover:text-[#F97316]"
          >
            Ver detalhes
            <ChevronDown
              className={`size-4 transition ${detailsOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F3F4F6] p-3">
      <Icon className="size-4 text-[#F97316]" aria-hidden="true" />
      <p className="mt-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#111827]/35">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-[#111827]">{value}</p>
    </div>
  );
}
