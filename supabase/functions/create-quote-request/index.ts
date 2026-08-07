import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type QuoteRequestInput = {
  business_category_id?: string | null;
  part_name: string;
  vehicle_brand?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_engine?: string | null;
  observation?: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!supabaseUrl || !serviceRoleKey || !authorization) {
    return new Response(JSON.stringify({ error: "Missing server configuration or authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? serviceRoleKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const body = (await request.json()) as QuoteRequestInput;
  if (!body.part_name?.trim() || !Number.isFinite(body.latitude) || !Number.isFinite(body.longitude) || !Number.isInteger(body.radius_meters) || body.radius_meters <= 0) {
    return new Response(JSON.stringify({ error: "Invalid quote request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const service = createClient(supabaseUrl, serviceRoleKey);
  const description = [body.part_name.trim(), body.vehicle_brand, body.vehicle_model, body.vehicle_year, body.vehicle_engine, body.observation].filter(Boolean).join(" · ");
  const expiresAt = new Date(Date.now() + 7 * 60 * 1000).toISOString();
  const { data: requestRow, error: requestError } = await service.from("quote_requests").insert({
    customer_id: userData.user.id,
    business_category_id: body.business_category_id ?? null,
    part_name: body.part_name.trim(),
    vehicle_brand: body.vehicle_brand ?? null,
    vehicle_model: body.vehicle_model ?? null,
    vehicle_year: body.vehicle_year ?? null,
    vehicle_engine: body.vehicle_engine ?? null,
    observation: body.observation ?? null,
    description,
    latitude: body.latitude,
    longitude: body.longitude,
    radius_meters: body.radius_meters,
    expires_at: expiresAt,
    status: "waiting",
  }).select().single();
  if (requestError || !requestRow) return new Response(JSON.stringify({ error: requestError?.message ?? "Could not create request" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data: notifications, error: notificationError } = await service.rpc("criar_notificacoes", { target_request_id: requestRow.id });
  if (notificationError) return new Response(JSON.stringify({ error: notificationError.message, request_id: requestRow.id }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return new Response(JSON.stringify({ request: requestRow, notifications: notifications ?? [] }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
