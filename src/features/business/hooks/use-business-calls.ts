"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getBusinessCalls } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

export function useBusinessCalls() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["business-calls"], queryFn: getBusinessCalls, staleTime: 10_000 });
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("business-calls").on("postgres_changes", { event: "*", schema: "public", table: "quote_notifications" }, () => { void queryClient.invalidateQueries({ queryKey: ["business-calls"] }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
  return query;
}
