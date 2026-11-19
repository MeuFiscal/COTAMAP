import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { CustomerHistoryList } from "@/features/quotes/components/customer-history-list";

export const metadata: Metadata = { title: "Histórico | CotaMap", robots: { index: false, follow: false } };

export default function HistoryPage() {
 return (
 <PrivateShell>
 {/* Hero Premium */}
 <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
 <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
 <div className="relative mx-auto max-w-[1440px]">
 <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Suas solicitações</p>
 <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Histórico</h1>
 <p className="mt-3 text-base text-white/75 sm:text-lg">Consulte chamados anteriores e repita uma solicitação quando precisar.</p>
 </div>
 </section>

 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="-mt-8">
 <CustomerHistoryList />
 </div>
 </div>
 </PrivateShell>
 );
}
