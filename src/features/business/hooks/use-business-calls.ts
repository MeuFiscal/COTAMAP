"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { getBusinessCallStatus, getBusinessCalls } from "@/services/business/business-service";
import { createClient } from "@/lib/supabase/client";

export function useBusinessCalls() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["business-calls"], queryFn: getBusinessCalls, staleTime: 10_000, refetchInterval: 5_000 });
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("business-calls").on("postgres_changes", { event: "*", schema: "public", table: "quote_notifications" }, (payload) => {
      if (payload.eventType === "UPDATE" && typeof payload.new.id === "string" && !["pending", "sent"].includes(String(payload.new.status))) {
        queryClient.setQueryData<Awaited<ReturnType<typeof getBusinessCalls>>>(["business-calls"], (current) => current?.filter((item) => item.notification.id !== payload.new.id) ?? current);
      }
      void queryClient.invalidateQueries({ queryKey: ["business-calls"] });
    }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_requests" }, (payload) => {
      if (typeof payload.new.id === "string" && !["waiting"].includes(String(payload.new.status))) {
        queryClient.setQueryData<Awaited<ReturnType<typeof getBusinessCalls>>>(["business-calls"], (current) => current?.filter((item) => item.request.id !== payload.new.id) ?? current);
      }
      void queryClient.invalidateQueries({ queryKey: ["business-calls"] });
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
  return query;
}

export function useBusinessCallStatus(notificationId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["business-call-status", notificationId], queryFn: () => getBusinessCallStatus(notificationId), enabled: Boolean(notificationId), staleTime: 0, refetchInterval: 5_000 });
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`business-call-status:${notificationId}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_notifications", filter: `id=eq.${notificationId}` }, () => void queryClient.invalidateQueries({ queryKey: ["business-call-status", notificationId] })).on("postgres_changes", { event: "UPDATE", schema: "public", table: "quote_requests" }, () => void queryClient.invalidateQueries({ queryKey: ["business-call-status", notificationId] })).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [notificationId, queryClient]);
  return query;
}
