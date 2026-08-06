import { createBrowserClient } from "@supabase/ssr";

import { getPublicEnvironment } from "@/config/env";
import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabasePublishableKey } = getPublicEnvironment();
  browserClient = createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
  return browserClient;
}
