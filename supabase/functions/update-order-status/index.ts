import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { preflight } from "../_shared/cors.ts";

type Input = { order_id?: string; status?: "pending" | "preparing" | "ready" | "completed" };
Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  const url = Deno.env.get("SUPABASE_URL"); const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const anonKey = Deno.env.get("SUPABASE_ANON_KEY"); const authorization = request.headers.get("Authorization");
  if (!url || !serviceKey || !anonKey || !authorization) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } }); const service = createClient(url, serviceKey);
  const auth = await userClient.auth.getUser(); if (auth.error || !auth.data.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await request.json() as Input; if (!body.order_id || !body.status || body.status === "pending") return new Response(JSON.stringify({ error: "invalid_order_transition" }), { status: 400 });
  const { data, error } = await service.rpc("atualizar_status_pedido", { target_order_id: body.order_id, target_actor_profile_id: auth.data.user.id, target_status: body.status });
  if (error) { const status = error.message.includes("not_found") ? 404 : error.message.includes("authorized") ? 403 : 409; return new Response(JSON.stringify({ error: error.message }), { status, headers: { "Content-Type": "application/json" } }); }
  return new Response(JSON.stringify({ order: data }), { status: 200, headers: { "Content-Type": "application/json" } });
});
