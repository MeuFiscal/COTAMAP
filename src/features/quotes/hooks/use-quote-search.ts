"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { BusinessRow, QuoteNotificationRow, QuoteRequestRow } from "@/types/database";

export type CustomerNotification = QuoteNotificationRow & { business: BusinessRow | null };

export function useQuoteSearch(requestId: string | null) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const requestQuery = useQuery({
    queryKey: ["quote-request", requestId],
    enabled: Boolean(requestId),
    refetchInterval: 5_000,
    queryFn: async (): Promise<QuoteRequestRow> => {
      const { data, error } = await createClient().from("quote_requests").select("*").eq("id", requestId as string).single();
      if (error) throw error;
      return data;
    },
  });
  const notificationsQuery = useQuery({
    queryKey: ["quote-notifications", requestId],
    enabled: Boolean(requestId),
    refetchInterval: 5_000,
    queryFn: async (): Promise<CustomerNotification[]> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("quote_notifications").select("*").eq("quote_request_id", requestId as string).is("deleted_at", null).order("dispatch_order");
      if (error) throw error;
      const notifications = (data ?? []) as QuoteNotificationRow[];
      const businessIds = [...new Set(notifications.map((notification) => notification.business_id))];
      if (!businessIds.length) return [];
      const businesses = await supabase.from("businesses").select("*").in("id", businessIds);
      if (businesses.error) throw businesses.error;
      const businessMap = new Map<string, BusinessRow>((businesses.data ?? []).map((business) => [business.id, business as BusinessRow]));
      return notifications.map((notification) => ({ ...notification, business: businessMap.get(notification.business_id) ?? null }));
    },
  });

  useEffect(() => {
    if (!requestId) return;
    const supabase = createClient();
    const channel = supabase.channel(`quote-search:${requestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_requests", filter: `id=eq.${requestId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: ["quote-request", requestId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_notifications", filter: `quote_request_id=eq.${requestId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: ["quote-notifications", requestId] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient, requestId]);

  const expiresAt = requestQuery.data?.expires_at ? new Date(requestQuery.data.expires_at).getTime() : null;
  useEffect(() => {
    if (!expiresAt || expiresAt <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);
  const remainingSeconds = expiresAt ? Math.max(0, Math.ceil((expiresAt - now) / 1000)) : 0;
  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  return useMemo(() => ({
    request: requestQuery.data,
    notifications,
    remainingSeconds,
    loading: requestQuery.isLoading || notificationsQuery.isLoading,
    error: requestQuery.error ?? notificationsQuery.error,
    empty: Boolean(requestQuery.data && notificationsQuery.isSuccess && notifications.length === 0),
    expired: requestQuery.data?.status === "expired" || remainingSeconds === 0,
  }), [notifications, notificationsQuery.error, notificationsQuery.isLoading, notificationsQuery.isSuccess, remainingSeconds, requestQuery.data, requestQuery.error, requestQuery.isLoading]);
}
