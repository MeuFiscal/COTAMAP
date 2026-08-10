import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !serviceKey || !anonKey || !authorization) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const service = createClient(url, serviceKey);
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json() as { quotation_id?: string };
  if (!body.quotation_id) return json({ error: "quotation_id is required" }, 400);
  const { data, error } = await service.rpc("escolher_cotacao", { target_quotation_id: body.quotation_id, target_customer_id: authData.user.id });
  if (error) return json({ error: error.message }, 409);
  return json({ order: data });
});
