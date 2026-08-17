"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

type Operator = { id: string; businessId: string; profileId: string; role: string; name: string; presenceStatus: "online" | "offline" };
type Business = { id: string; name: string; logoUrl: string | null; isAvailableForRequests: boolean; availabilityUpdatedAt: string | null };
type OperatorContextValue = { ready: boolean; operator: Operator | null; business: Business | null; setOperator: (operator: Operator) => void; clearOperator: () => void; setBusiness: (business: Business) => void };
const OperatorContext = createContext<OperatorContextValue | null>(null);

export function OperatorProvider({ children }: { children: ReactNode }) {
  const [operator, setOperatorState] = useState<Operator | null>(null);
  const [ready, setReady] = useState(false);
  const [business, setBusinessState] = useState<Business | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) { if (!cancelled) setReady(true); return; }
      const businessId = await getCurrentBusinessId();
      try {
        const stored = window.sessionStorage.getItem("cotamap.operator");
        const parsed = stored ? JSON.parse(stored) as Partial<Operator> : null;
        if (!cancelled && parsed?.id && parsed.businessId === businessId) {
          // O vínculo só é restaurado quando pertence à empresa atual.
          setOperatorState(parsed as Operator);
        } else if (stored) {
          window.sessionStorage.removeItem("cotamap.operator");
        }
      } catch {
        window.sessionStorage.removeItem("cotamap.operator");
      }
      const { data: businessRow } = await supabase.from("businesses").select("id,name,logo_url,is_available_for_requests,availability_updated_at").eq("id", businessId).maybeSingle();
      if (!cancelled) {
        if (businessRow) setBusinessState({ id: businessRow.id, name: businessRow.name, logoUrl: businessRow.logo_url, isAvailableForRequests: Boolean(businessRow.is_available_for_requests), availabilityUpdatedAt: businessRow.availability_updated_at });
        setReady(true);
      }
    })().catch(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  const value = useMemo<OperatorContextValue>(() => ({
    ready,
    operator,
    business,
    setOperator: (next) => { setOperatorState(next); window.sessionStorage.setItem("cotamap.operator", JSON.stringify(next)); },
    setBusiness: setBusinessState,
    clearOperator: () => { setOperatorState(null); window.sessionStorage.removeItem("cotamap.operator"); },
  }), [ready, operator, business]);
  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) throw new Error("useOperator deve ser usado dentro de OperatorProvider");
  return context;
}
