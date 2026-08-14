import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json, preflight } from "../_shared/cors.ts";

type Action = "products" | "offers";
type CaktoRow = Record<string, unknown>;

const text = (value: unknown) => typeof value === "string" ? value : "";
const numberOrNull = (value: unknown) => typeof value === "number" ? value : value == null ? null : Number(value);

async function assertAdmin(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("Authorization");
  if (!url || !anon || !service || !authorization) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const userClient = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
  const identity = await userClient.auth.getUser();
  if (identity.error || !identity.data.user) throw new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  const adminClient = createClient(url, service);
  const { data: admin } = await adminClient.from("platform_admins").select("active").ilike("email", identity.data.user.email ?? "").maybeSingle();
  if (!admin?.active) throw new Response(JSON.stringify({ error: "admin_not_authorized" }), { status: 403 });
}

async function caktoRequest(path: string, init?: RequestInit) {
  const clientId = Deno.env.get("CAKTO_CLIENT_ID");
  const clientSecret = Deno.env.get("CAKTO_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("cakto_not_configured");
  const tokenResponse = await fetch("https://api.cakto.com.br/public_api/token/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }) });
  if (!tokenResponse.ok) throw new Error("cakto_auth_failed");
  const token = await tokenResponse.json() as { access_token?: string };
  if (!token.access_token) throw new Error("cakto_auth_failed");
  const response = await fetch(`https://api.cakto.com.br/public_api/${path}`, { ...init, headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`cakto_api_${response.status}`);
  return response.json() as Promise<{ results?: CaktoRow[]; next?: string | null }>;
}

async function collect(path: string) {
  const rows: CaktoRow[] = [];
  let next: string | null = path;
  while (next && rows.length < 500) {
    const page = await caktoRequest(next);
    rows.push(...(page.results ?? []));
    next = page.next ?? null;
  }
  return rows;
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  try {
    if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
    await assertAdmin(req);
    const body = await req.json() as { action?: Action; product_id?: string };
    if (body.action === "products") {
      const products = await collect("products/");
      return json({ products: products.map((item) => ({ id: text(item.id), name: text(item.name), price: numberOrNull(item.price), type: text(item.type), status: text(item.status), image: text(item.image) || null })).filter((item) => item.id).sort((a, b) => Number(b.status === "active") - Number(a.status === "active")) });
    }
    if (body.action === "offers" && body.product_id) {
      const offers = await collect(`offers/?product=${encodeURIComponent(body.product_id)}`);
      return json({ offers: offers.map((item) => ({ id: text(item.id), name: text(item.name), price: numberOrNull(item.price), product: text(item.product), status: text(item.status), type: text(item.type), recurrence_period: numberOrNull(item.recurrence_period), quantity_recurrences: numberOrNull(item.quantity_recurrences), trial_days: numberOrNull(item.trial_days), default: item.default === true })) });
    }
    return json({ error: "invalid_parameters" }, 400);
  } catch (error) {
    if (error instanceof Response) return new Response(error.body, { status: error.status, headers: { ...Object.fromEntries(error.headers), "Content-Type": "application/json" } });
    return json({ error: error instanceof Error ? error.message : "catalog_error" }, 502);
  }
});
