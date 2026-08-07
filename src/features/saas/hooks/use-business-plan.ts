"use client";
import { useQuery } from "@tanstack/react-query"; import { getBusinessPlan } from "@/services/saas/plan-service";
export function useBusinessPlan() { return useQuery({ queryKey: ["business-plan"], queryFn: getBusinessPlan }); }
