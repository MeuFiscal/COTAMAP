import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { CustomerHistoryList } from "@/features/quotes/components/customer-history-list";

export const metadata: Metadata = { title: "Histórico | CotaMap", robots: { index: false, follow: false } };

export default function HistoryPage() {
  return <PrivateShell><div className="mx-auto max-w-4xl"><header className="mb-8 sm:mb-10"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">Suas solicitações</p><h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#111827] sm:text-5xl">Histórico</h1><p className="mt-3 text-base leading-7 text-[#111827]/55">Consulte chamados anteriores e repita uma solicitação quando precisar.</p></header><CustomerHistoryList /></div></PrivateShell>;
}
