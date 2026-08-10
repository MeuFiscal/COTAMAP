import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { QuoteList } from "@/features/quotes/components/quote-list";

export const metadata: Metadata = {
  title: "Suas cotações | CotaMap",
  robots: { index: false, follow: false },
};

export default async function QuotesPage({
  searchParams,
}: {
    searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;

  return (
    <PrivateShell>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">
            Comparação inteligente
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.045em] text-[#111827] sm:text-5xl">
            Suas cotações
          </h1>
          <p className="mt-3 text-base leading-7 text-[#111827]/55">
            Compare preço, distância, avaliação e tempo de retirada.
          </p>
        </header>
        <QuoteList requestId={request ?? null} />
      </div>
    </PrivateShell>
  );
}
