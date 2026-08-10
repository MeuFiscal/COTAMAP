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
  const auth = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const service = createClient(url, serviceKey);
  const { data: userData, error: userError } = await auth.auth.getUser();
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json() as { request_id?: string };
  if (!body.request_id) return json({ error: "request_id is required" }, 400);
  const { data, error } = await service.rpc("cancel_quote_request", { target_request_id: body.request_id, target_customer_id: userData.user.id });
  if (error) return json({ error: error.message }, error.message === "request_not_cancellable" ? 409 : 400);
  return json({ request: data });
});
