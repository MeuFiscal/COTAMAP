import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export function clients(request: Request): { user: SupabaseClient; service: SupabaseClient; authorization: string } {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !serviceKey || !anonKey || !authorization) throw new Error("Unauthorized");
  return { user: createClient(url, anonKey, { global: { headers: { Authorization: authorization } } }), service: createClient(url, serviceKey), authorization };
}

export { json } from "./cors.ts";

export async function actor(service: SupabaseClient, user: SupabaseClient, businessId: string) {
  const { data: authData, error: authError } = await user.auth.getUser();
  if (authError || !authData.user) throw new Error("Unauthorized");
  const { data, error } = await service.from("business_employees").select("id, role").eq("business_id", businessId).eq("profile_id", authData.user.id).eq("is_active", true).is("deleted_at", null).maybeSingle();
  if (error || !data || !["owner", "manager"].includes(data.role)) throw new Error("Forbidden");
  return authData.user;
}

export async function audit(service: SupabaseClient, actorId: string, businessId: string, action: string, entityId: string | null, metadata: Record<string, unknown>) {
  await service.from("audit_logs").insert({ actor_profile_id: actorId, entity_type: "business_employee", entity_id: entityId, action, metadata: { ...metadata, business_id: businessId } });
}
