import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return new Response(JSON.stringify({ error: "Missing server configuration" }), { status: 500 });
  const body = (await request.json()) as { request_id?: string };
  if (!body.request_id) return new Response(JSON.stringify({ error: "request_id is required" }), { status: 400 });
  const service = createClient(url, key);
  const { data, error } = await service.rpc("expirar_solicitacao", { target_request_id: body.request_id });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ request: data }), { status: 200, headers: { "Content-Type": "application/json" } });
});
