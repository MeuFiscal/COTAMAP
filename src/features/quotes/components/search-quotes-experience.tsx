"use client";

import { ArrowRight, Building2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BusinessProgressCard } from "@/features/quotes/components/business-progress-card";
import { Countdown } from "@/features/quotes/components/countdown";
import { EmptyState } from "@/features/quotes/components/empty-state";
import { QuoteArrivalToast } from "@/features/quotes/components/quote-arrival-toast";
import { RequestSummaryCard } from "@/features/quotes/components/request-summary-card";
import { SearchAnimation } from "@/features/quotes/components/search-animation";
import { SearchStatus } from "@/features/quotes/components/search-status";
import { getQuotePreview } from "@/features/quotes/search/quote-preview-store";
import type {
  BusinessProgress,
  QuoteRequestPreview,
  SearchPhase,
} from "@/features/quotes/search/search-types";

const SEARCH_DURATION_SECONDS = 7 * 60;

const fallbackRequest: QuoteRequestPreview = {
  partName: "Pastilha de freio dianteira",
  vehicle: "Honda Civic · 2020 · 2.0 Flex",
  radius: 10,
  photoUrl: null,
};

const businesses: readonly BusinessProgress[] = [
  { id: "silva", name: "Auto Peças Silva", status: "Respondendo..." },
  { id: "centro", name: "Centro Auto Parts", status: "Visualizou" },
  { id: "parana", name: "Paraná Auto Peças", status: "Preparando cotação" },
];

function getPhase(elapsed: number): SearchPhase {
  if (elapsed < 3) return "locating";
  if (elapsed < 6) return "sending";
  if (elapsed < 10) return "waiting";
  return "receiving";
}

function getBusinessCount(elapsed: number): number {
  if (elapsed < 4) return 0;
  if (elapsed < 7) return 1;
  if (elapsed < 9) return 2;
  return 3;
}

export function SearchQuotesExperience({ initialEmpty = false }: { initialEmpty?: boolean }) {
  const [request, setRequest] = useState<QuoteRequestPreview>(
    () => getQuotePreview() ?? fallbackRequest,
  );
  const [elapsed, setElapsed] = useState(0);
  const [toastDismissed, setToastDismissed] = useState(false);
  const [emptySimulation, setEmptySimulation] = useState(initialEmpty);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((current) => Math.min(current + 1, SEARCH_DURATION_SECONDS));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const phase = getPhase(elapsed);
  const businessCount = getBusinessCount(elapsed);
  const visibleBusinesses = businesses.slice(0, businessCount);
  const remainingSeconds = Math.max(SEARCH_DURATION_SECONDS - elapsed, 0);
  const hasQuote = elapsed >= 11;
  const isEmpty = emptySimulation || (remainingSeconds === 0 && !hasQuote);

  function restart() {
    setElapsed(0);
    setToastDismissed(false);
    setEmptySimulation(false);
  }

  function expandRadius() {
    setRequest((current) => ({ ...current, radius: 50 }));
    restart();
  }

  if (isEmpty) {
    return <EmptyState onExpandRadius={expandRadius} onRetry={restart} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <RequestSummaryCard request={request} />

      <section className="grid overflow-hidden rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] shadow-[0_24px_70px_rgba(17,24,39,0.07)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between p-6 sm:p-9 lg:p-11">
          <SearchStatus phase={phase} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Countdown seconds={remainingSeconds} />
            <div className="border-[#111827]/8 rounded-2xl border p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#111827]/45">
                <Building2 className="size-4 text-[#F97316]" aria-hidden="true" />
                Empresas encontradas
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
                {businessCount}
                <span className="ml-1 text-base text-[#111827]/35">/ 5</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid min-h-80 place-items-center bg-[#F3F4F6]/70 p-5 sm:p-8">
          <SearchAnimation />
        </div>
      </section>

      <section
        aria-labelledby="businesses-title"
        className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-5 shadow-sm sm:p-8"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F97316]">
              Movimento ao vivo
            </p>
            <h2 id="businesses-title" className="mt-2 text-2xl font-black tracking-[-0.03em]">
              Empresas próximas
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#111827]/40">Simulação</span>
        </div>
        {visibleBusinesses.length > 0 ? (
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {visibleBusinesses.map((business, index) => (
              <BusinessProgressCard key={business.id} business={business} index={index} />
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#111827]/15 bg-[#F3F4F6]/50 p-7 text-center text-sm text-[#111827]/45">
            Mapeando empresas dentro do raio escolhido...
          </div>
        )}

        {hasQuote ? (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#111827] p-5 text-[#FFFFFF] sm:flex-row">
            <div>
              <p className="text-sm font-black">Uma nova cotação chegou</p>
              <p className="mt-1 text-xs text-[#FFFFFF]/55">
                O valor ficará disponível na próxima etapa.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 text-sm font-black uppercase tracking-[0.06em] transition hover:bg-[#FFFFFF] hover:text-[#111827] sm:w-auto"
            >
              Ver cotações
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </section>

      <QuoteArrivalToast
        visible={hasQuote && !toastDismissed}
        onClose={() => setToastDismissed(true)}
      />
    </div>
  );
}
