"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { QuoteCard } from "@/features/quotes/components/quote-card";
import { QuoteFilters } from "@/features/quotes/components/quote-filters";
import type { QuoteComparison, QuoteSort } from "@/features/quotes/comparison/quote-types";
import { createClient } from "@/lib/supabase/client";

function sortQuotes(quotes: readonly QuoteComparison[], sort: QuoteSort): QuoteComparison[] {
  return [...quotes].sort((a, b) => sort === "price" ? a.price - b.price : sort === "distance" ? a.distanceKm - b.distanceKm : sort === "rating" ? b.rating - a.rating : a.pickupMinutes - b.pickupMinutes);
}

function toComparison(row: { id: string; business_id: string; amount: number; brand: string | null; notes: string | null; status: string }): QuoteComparison {
  return { id: row.id, businessName: `Empresa ${row.business_id.slice(0, 8)}`, businessInitials: "EM", rating: 0, reviewCount: 0, cotamapScore: 0, price: row.amount, brand: row.brand ?? "Marca não informada", note: row.notes ?? "Sem observações.", description: row.notes ?? "Sem descrição adicional.", distanceKm: 0, pickupMinutes: 0, pickupLabel: "Não informado", responseMinutes: 0, status: row.status === "accepted" ? "Pronta" : "Separando", address: "Endereço não informado", openingHours: "Horário não informado", paymentMethods: [], imagePosition: "50% 50%" };
}

export function QuoteList({ requestId }: { requestId: string | null }) {
  const [sort, setSort] = useState<QuoteSort>("price");
  const [favorites, setFavorites] = useState<ReadonlySet<string>>(() => new Set());
  const quotesQuery = useQuery({ queryKey: ["quotations", requestId], enabled: Boolean(requestId), queryFn: async () => { const { data, error } = await createClient().from("quotations").select("id,business_id,amount,brand,notes,status").eq("quote_request_id", requestId as string).order("amount"); if (error) throw error; return data.map(toComparison); } });
  const quotes = useMemo(() => sortQuotes(quotesQuery.data ?? [], sort), [quotesQuery.data, sort]);
  if (quotesQuery.isLoading) return <p className="rounded-2xl bg-[#FFFFFF] p-8 text-center text-sm font-semibold">Carregando cotações...</p>;
  if (quotesQuery.error) return <p className="rounded-2xl bg-[#F97316]/10 p-8 text-center text-sm font-semibold text-[#9A3412]">Não foi possível carregar as cotações.</p>;
  if (!quotes.length) return <p className="rounded-2xl border border-dashed border-[#111827]/15 bg-[#FFFFFF] p-8 text-center text-sm text-[#111827]/55">Nenhuma cotação recebida ainda.</p>;
  return <><div className="sticky top-16 z-30 -mx-4 border-y border-[#111827]/5 bg-[#F3F4F6]/95 px-4 py-4 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border sm:px-5"><QuoteFilters value={sort} onChange={setSort} /></div><motion.div layout className="mt-6 grid gap-5 lg:grid-cols-2">{quotes.map((quote) => <QuoteCard key={quote.id} quote={quote} favorite={favorites.has(quote.id)} onFavorite={() => setFavorites((current) => { const next = new Set(current); if (next.has(quote.id)) next.delete(quote.id); else next.add(quote.id); return next; })} />)}</motion.div></>;
}
