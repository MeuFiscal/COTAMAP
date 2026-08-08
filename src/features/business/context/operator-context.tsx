"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

type Operator = { id: string; profileId: string; role: string; name: string; presenceStatus: "online" | "offline" };
type OperatorContextValue = { operator: Operator | null; setOperator: (operator: Operator) => void; clearOperator: () => void };
const OperatorContext = createContext<OperatorContextValue | null>(null);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperatorState] = useState<Operator | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = window.sessionStorage.getItem("cotamap.operator");
    return saved ? (JSON.parse(saved) as Operator) : null;
  });
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const businessId = await getCurrentBusinessId();
      const { data: employee } = await supabase.from("business_employees").select("id,profile_id,role,presence_status").eq("business_id", businessId).eq("profile_id", auth.user.id).eq("is_active", true).is("deleted_at", null).maybeSingle();
      const { data: profile } = employee ? await supabase.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle() : { data: null };
      const current = employee ? { ...employee, name: profile?.full_name ?? auth.user.email ?? "Operador" } : null;
      if (!cancelled && current) {
        const next = { id: current.id, profileId: current.profile_id, role: current.role, name: current.name, presenceStatus: current.presence_status === "online" ? "online" as const : "offline" as const };
        setOperatorState(next);
        window.sessionStorage.setItem("cotamap.operator", JSON.stringify(next));
      }
    })().catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
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
