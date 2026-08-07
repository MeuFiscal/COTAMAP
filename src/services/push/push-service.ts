import { createClient } from "@/lib/supabase/client";

export type PushPlatform = "web" | "android" | "ios";

export interface PushProvider {
  requestPermission(): Promise<NotificationPermission>;
  getToken(): Promise<string | null>;
}

/** Provider-neutral web adapter. Native apps can implement the same interface later. */
export const webPushProvider: PushProvider = {
  async requestPermission() {
    if (typeof Notification === "undefined") return "denied";
    return Notification.requestPermission();
  },
  async getToken() {
    return null;
  },
};

export async function registerDevice(profileId: string, platform: PushPlatform, token: string) {
  const supabase = createClient();
  const { error } = await supabase.from("push_devices").upsert(
    { profile_id: profileId, platform, token, active: true, last_seen_at: new Date().toISOString(), deleted_at: null },
    { onConflict: "profile_id,token" },
  );
  if (error) throw error;
}

export async function disableDevices(profileId: string) {
  const { error } = await createClient().from("push_devices").update({ active: false, last_seen_at: new Date().toISOString() }).eq("profile_id", profileId).eq("active", true);
  if (error) throw error;
}
