import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect(AUTH_ROUTES.login);
  return { supabase, user: data.user };
}

export async function requireProfile(): Promise<Profile> {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) redirect(AUTH_ROUTES.accessDenied);
  return data;
}
