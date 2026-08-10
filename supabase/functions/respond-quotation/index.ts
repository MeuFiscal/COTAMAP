import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

type ResponseInput = { notification_id: string; action: "accept" | "reject"; amount?: number; brand?: string | null; notes?: string | null; response_time_seconds?: number | null; image_path?: string | null; image_file_name?: string | null; image_mime_type?: string | null; image_size_bytes?: number | null };

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !serviceKey || !authorization) return json({ error: "Unauthorized" }, 401);
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);
  const body = (await request.json()) as ResponseInput;
  if (!body.notification_id || !["accept", "reject"].includes(body.action)) return json({ error: "Invalid response" }, 400);
  const service = createClient(url, serviceKey);
  let definitivePath: string | null = null;
  if (body.action === "accept" && body.image_path) {
    definitivePath = `${body.image_path.split("/")[0]}/${body.notification_id}/${body.image_file_name?.replace(/[^a-zA-Z0-9._-]/g, "-") || "quotation-image"}`;
    const { error } = await service.storage.from("quotation-images").move(body.image_path, definitivePath);
    if (error) return json({ error: error.message }, 400);
  }
  const { data, error } = await service.rpc("responder_cotacao", { target_notification_id: body.notification_id, target_actor_profile_id: userData.user.id, target_action: body.action, target_amount: body.amount ?? null, target_brand: body.brand ?? null, target_notes: body.notes ?? null, target_response_time_seconds: body.response_time_seconds ?? null, target_image_path: definitivePath, target_image_file_name: body.image_file_name ?? null, target_image_mime_type: body.image_mime_type ?? null, target_image_size_bytes: body.image_size_bytes ?? null });
  if (error) {
    if (definitivePath) await service.storage.from("quotation-images").remove([definitivePath]);
    return json({ error: error.message }, 400);
  }
  return json({ quotation: data });
});
