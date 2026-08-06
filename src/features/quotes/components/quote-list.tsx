"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import { QuoteCard } from "@/features/quotes/components/quote-card";
import { QuoteFilters } from "@/features/quotes/components/quote-filters";
import { simulatedQuotes } from "@/features/quotes/comparison/quote-data";
import type { QuoteComparison, QuoteSort } from "@/features/quotes/comparison/quote-types";

function sortQuotes(quotes: readonly QuoteComparison[], sort: QuoteSort): QuoteComparison[] {
  return [...quotes].sort((first, second) => {
    if (sort === "price") return first.price - second.price;
    if (sort === "distance") return first.distanceKm - second.distanceKm;
    if (sort === "rating") return second.rating - first.rating;
    return first.pickupMinutes - second.pickupMinutes;
  });
}

export function QuoteList() {
  const [sort, setSort] = useState<QuoteSort>("price");
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(() => new Set());
  const sortedQuotes = sortQuotes(simulatedQuotes, sort);

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-y border-[#111827]/5 bg-[#F3F4F6]/95 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <QuoteFilters value={sort} onChange={setSort} />
      </div>
      <motion.div layout className="mt-6 grid gap-5 lg:grid-cols-2">
        {sortedQuotes.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            favorite={favorites.has(quote.id)}
            onFavorite={() => toggleFavorite(quote.id)}
          />
        ))}
      </motion.div>
    </>
  );
}
