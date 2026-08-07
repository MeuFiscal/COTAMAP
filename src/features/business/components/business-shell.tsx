"use client";

import type { ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useOperator } from "@/features/business/context/operator-context";

export function BusinessShell({ children }: { children: ReactNode }) {
  const { operator } = useOperator();
  return <PrivateShell><div className="mb-6 rounded-2xl border border-[#111827]/10 bg-white px-4 py-3 text-sm"><span className="font-bold">Operação:</span> {operator?.name ?? "Nenhum operador selecionado"} <span className="ml-2 text-emerald-600">● Online</span></div>{children}</PrivateShell>;
}
