"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerDevice, webPushProvider } from "@/services/push/push-service";

export function PushBootstrap() {
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (cancelled || !data.user || typeof window === "undefined" || !("Notification" in window)) return;
      const permission = await webPushProvider.requestPermission();
      if (permission !== "granted" || cancelled) return;
      const token = await webPushProvider.getToken();
      if (token) await registerDevice(data.user.id, "web", token);
    })();
    return () => { cancelled = true; };
  }, []);
  return null;
}
