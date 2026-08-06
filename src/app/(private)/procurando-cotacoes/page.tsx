import type { Metadata } from "next";
import { Radar, Search } from "lucide-react";
import Link from "next/link";

import { PrivateShell } from "@/features/auth/components/private-shell";

export const metadata: Metadata = {
  title: "Procurando cotações | CotaMap",
  robots: { index: false, follow: false },
};

export default function SearchingQuotesPlaceholderPage() {
  return (
    <PrivateShell>
      <section className="mx-auto grid min-h-[calc(100vh-11rem)] max-w-3xl place-items-center">
        <div className="w-full rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-7 text-center shadow-[0_24px_70px_rgba(17,24,39,0.08)] sm:p-12">
          <div className="relative mx-auto grid size-24 place-items-center rounded-full bg-[#F97316]/10 text-[#F97316]">
            <span className="absolute inset-0 animate-ping rounded-full border border-[#F97316]/20" />
            <Radar className="size-11" aria-hidden="true" />
          </div>
          <p className="mt-8 text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">
            Solicitação preparada
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
            Procurando cotações
          </h1>
          <p className="mx-auto mt-4 max-w-lg leading-7 text-[#111827]/55">
            Esta é a prévia da próxima etapa. Nenhuma solicitação foi enviada e nenhuma loja foi
            notificada.
          </p>
          <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-2xl bg-[#F3F4F6] p-4 text-left">
            <Search className="size-5 shrink-0 text-[#F97316]" aria-hidden="true" />
            <p className="text-sm font-bold">Em breve, as cotações recebidas aparecerão aqui.</p>
          </div>
          <Link
            href="/nova-cotacao"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl border border-[#111827]/10 px-5 text-sm font-black transition hover:border-[#F97316] hover:text-[#F97316]"
          >
            Criar outra simulação
          </Link>
        </div>
      </section>
    </PrivateShell>
  );
}
