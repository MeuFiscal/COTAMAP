"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Operator = { id: string; profileId: string; role: string; name: string };
type OperatorContextValue = { operator: Operator | null; setOperator: (operator: Operator) => void; clearOperator: () => void };
const OperatorContext = createContext<OperatorContextValue | null>(null);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperatorState] = useState<Operator | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = window.sessionStorage.getItem("cotamap.operator");
    return saved ? (JSON.parse(saved) as Operator) : null;
  });
  const value = useMemo<OperatorContextValue>(() => ({
    operator,
    setOperator: (next) => { setOperatorState(next); window.sessionStorage.setItem("cotamap.operator", JSON.stringify(next)); },
    clearOperator: () => { setOperatorState(null); window.sessionStorage.removeItem("cotamap.operator"); },
  }), [operator]);
  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) throw new Error("useOperator deve ser usado dentro de OperatorProvider");
  return context;
}
