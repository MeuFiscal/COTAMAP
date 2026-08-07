import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
type Input = { recipient_profile_id: string; type: string; title: string; message: string; entity_type?: string; entity_id?: string };
Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405 });
  const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); const auth = request.headers.get("Authorization");
  if (!url || !key || !auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const user = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? key, { global: { headers: { Authorization: auth } } }); const service = createClient(url, key); const actor = await user.auth.getUser();
  if (actor.error || !actor.data.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const body = await request.json() as Input; if (!body.recipient_profile_id || !body.type || !body.title || !body.message) return new Response(JSON.stringify({ error: "Invalid notification" }), { status: 400 });
  const { data: platformAdmin } = await service.from("platform_admins").select("id").eq("email", actor.data.user.email ?? "").eq("active", true).maybeSingle(); if (body.recipient_profile_id !== actor.data.user.id && !platformAdmin) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  const created = await service.from("notification_center").insert({ recipient_profile_id: body.recipient_profile_id, type: body.type, title: body.title, message: body.message, entity_type: body.entity_type ?? null, entity_id: body.entity_id ?? null, realtime_sent_at: new Date().toISOString() }).select().single();
  if (created.error) return new Response(JSON.stringify({ error: created.error.message }), { status: 400 }); await service.from("audit_logs").insert({ actor_profile_id: actor.data.user.id, entity_type: "notification", entity_id: created.data.id, action: "created", metadata: { recipient_profile_id: body.recipient_profile_id, type: body.type } }); return new Response(JSON.stringify({ notification: created.data }), { status: 201, headers: { "Content-Type": "application/json" } });
});
