"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { BusinessLogo } from "@/components/business-logo";
import { BusinessShell } from "@/features/business/components/business-shell";
import { useOperator } from "@/features/business/context/operator-context";
import { useAuth } from "@/hooks/use-auth";
import { getBusinessDashboard } from "@/services/analytics/dashboard-service";

function getBusinessGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function brazilHour(): number {
  return Number(new Intl.DateTimeFormat("en-US", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
}

export default function BusinessDashboardPage() {
  const query = useQuery({ queryKey: ["business-dashboard"], queryFn: getBusinessDashboard, staleTime: 30_000 });
  const { user } = useAuth();
  const { business, operator } = useOperator();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "sua equipe";

  return (
    <BusinessShell>
      <header className="rounded-3xl border border-[#111827]/10 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <BusinessLogo src={business?.logoUrl} name={business?.name} className="size-16" />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Visão geral</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{getBusinessGreeting(brazilHour())}, {firstName}</h1>
              <p className="mt-2 truncate text-sm text-black/55">{business?.name ?? "Sua empresa"} · {operator?.role === "owner" ? "Proprietário" : operator?.role === "manager" ? "Gerente" : "Operador"}</p>
            </div>
          </div>
          <Link href="/empresa/configuracoes/cadastrais" className="inline-flex rounded-xl border border-[#F97316]/30 px-4 py-2 text-sm font-black text-[#F97316]">Editar perfil da empresa</Link>
        </div>
        {query.data?.generatedAt ? <time className="mt-5 block text-xs text-black/45" dateTime={query.data.generatedAt}>Atualizado às {new Date(query.data.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time> : null}
      </header>
      {query.isLoading ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Carregando indicadores">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-white/70" />)}</div> : query.error ? <p role="alert" className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">Não foi possível carregar o dashboard. Tente novamente.</p> : <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{query.data?.metrics.map((metric) => <article key={metric.label} className="rounded-2xl border border-[#111827]/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5"><p className="text-sm text-black/55">{metric.label}</p><strong className="mt-2 block text-2xl">{metric.value}</strong></article>)}</div>}
    </BusinessShell>
  );
}
