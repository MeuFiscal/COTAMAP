"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOperator } from "@/features/business/context/operator-context";
import { getBusinessPlan, requestBusinessPlanCancellation } from "@/services/saas/plan-service";
export function useBusinessPlan() {
  const { operator } = useOperator();
  const businessId = operator?.businessId;
  return useQuery({ queryKey: ["business-plan", businessId], queryFn: () => getBusinessPlan(businessId), enabled: Boolean(businessId) });
}
export function useCancelBusinessPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: requestBusinessPlanCancellation,
    onSuccess: () => client.invalidateQueries({ queryKey: ["business-plan"] }),
    onError: () => { void client.invalidateQueries({ queryKey: ["business-plan"] }); },
  });
}
