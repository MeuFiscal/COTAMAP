"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSelectedBusinessId } from "@/services/business/business-service";

type Operator = { id: string; businessId: string; profileId: string; role: string; name: string; presenceStatus: "online" | "offline" };
type Business = { id: string; name: string; logoUrl: string | null; isAvailableForRequests: boolean; availabilityUpdatedAt: string | null };
type OperatorContextValue = { ready: boolean; operator: Operator | null; business: Business | null; setOperator: (operator: Operator) => void; clearOperator: () => void; setBusiness: (business: Business) => void; clearBusiness: () => void };
const OperatorContext = createContext<OperatorContextValue | null>(null);

function selectedOperatorKey(businessId: string): string { return `cotamap:selected-operator:v1:${businessId}`; }

function readStoredOperator(businessId: string): Operator | null {
  const keys = [selectedOperatorKey(businessId), "cotamap.operator"];
  for (const key of keys) {
    try {
      const stored = window.sessionStorage.getItem(key);
      if (!stored) continue;
      const parsed = JSON.parse(stored) as Partial<Operator>;
      if (parsed.id && parsed.businessId === businessId) return parsed as Operator;
      window.sessionStorage.removeItem(key);
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }
  return null;
}

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
      const businessId = await getSelectedBusinessId();
      if (!businessId) {
        window.sessionStorage.removeItem("cotamap.operator");
        if (!cancelled) {
          setOperatorState(null);
          setBusinessState(null);
          setReady(true);
        }
        return;
      }
      const storedOperator = readStoredOperator(businessId);
      if (storedOperator) {
        const { data: employee } = await supabase.from("business_employees")
          .select("id,business_id,profile_id,role,presence_status")
          .eq("id", storedOperator.id)
          .eq("business_id", businessId)
          .eq("is_active", true)
          .is("deleted_at", null)
          .maybeSingle();
        if (!cancelled && employee) {
          // Só restaura a sessão já autenticada de um vínculo ainda ativo na empresa atual.
          setOperatorState({
            id: employee.id,
            businessId: employee.business_id,
            profileId: employee.profile_id,
            role: employee.role,
            name: storedOperator.name,
            presenceStatus: employee.presence_status === "online" ? "online" : "offline",
          });
        } else if (!employee) {
          window.sessionStorage.removeItem(selectedOperatorKey(businessId));
          window.sessionStorage.removeItem("cotamap.operator");
        }
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
    setOperator: (next) => {
      const serialized = JSON.stringify(next);
      setOperatorState(next);
      window.sessionStorage.setItem("cotamap.operator", serialized);
      window.sessionStorage.setItem(selectedOperatorKey(next.businessId), serialized);
    },
    setBusiness: setBusinessState,
    clearOperator: () => {
      setOperatorState(null);
      window.sessionStorage.removeItem("cotamap.operator");
      if (operator?.businessId) window.sessionStorage.removeItem(selectedOperatorKey(operator.businessId));
    },
    clearBusiness: () => setBusinessState(null),
  }), [ready, operator, business]);
  return <OperatorContext.Provider value={value}>{children}</OperatorContext.Provider>;
}

export function useOperator() {
  const context = useContext(OperatorContext);
  if (!context) throw new Error("useOperator deve ser usado dentro de OperatorProvider");
  return context;
}
