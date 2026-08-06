import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { EmptyQuotes } from "@/features/quotes/components/empty-quotes";
import { QuoteList } from "@/features/quotes/components/quote-list";
import { QuotesLoading } from "@/features/quotes/components/quotes-loading";
import type { QuotesViewState } from "@/features/quotes/comparison/quote-types";

export const metadata: Metadata = {
  title: "Suas cotações | CotaMap",
  robots: { index: false, follow: false },
};

function parseState(value: string | undefined): QuotesViewState {
  return value === "loading" || value === "empty" || value === "error" ? value : "list";
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state: stateParam } = await searchParams;
  const state = parseState(stateParam);

  return (
    <PrivateShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">
            Comparação inteligente
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.045em] text-[#111827] sm:text-5xl">
            Recebemos 5 cotações para você 🎉
          </h1>
          <p className="mt-3 text-base leading-7 text-[#111827]/55">
            Compare preço, distância, avaliação e tempo de retirada.
          </p>
        </header>
        {state === "loading" ? <QuotesLoading /> : null}
        {state === "empty" ? <EmptyQuotes /> : null}
        {state === "error" ? <EmptyQuotes error /> : null}
        {state === "list" ? <QuoteList /> : null}
      </div>
    </PrivateShell>
  );
}
