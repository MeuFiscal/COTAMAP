"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getBusinessPlan, requestBusinessPlanCancellation } from "@/services/saas/plan-service";
export function useBusinessPlan() { return useQuery({ queryKey: ["business-plan"], queryFn: getBusinessPlan }); }
export function useCancelBusinessPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: requestBusinessPlanCancellation,
    onSuccess: () => client.invalidateQueries({ queryKey: ["business-plan"] }),
  });
}
