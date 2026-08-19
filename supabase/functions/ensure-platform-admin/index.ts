import { clients, json } from "../_shared/admin.ts";
import { preflight } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const { user, service } = clients(request);
    const result = await user.auth.getUser();
    const authenticated = result.data.user;
    if (result.error || !authenticated) return json({ error: "Unauthorized" }, 401);
    const email = (authenticated.email ?? "").trim().toLowerCase();
    if (!email) return json({ is_admin: false });
    const existing = await service.from("platform_admins").select("id,active").eq("email", email).order("created_at", { ascending: true });
    if (existing.error) throw existing.error;
    if (existing.data.length > 1) return json({ error: "Multiple platform admin records found" }, 409);
    return json({ is_admin: existing.data[0]?.active === true });
  } catch (error) {
    console.error("ensure-platform-admin failed", error instanceof Error ? error.message : "unknown error");
    const message = error instanceof Error ? error.message : "Erro interno";
    if (message === "Unauthorized") return json({ error: message }, 401);
    return json({ error: message }, 500);
  }
});
