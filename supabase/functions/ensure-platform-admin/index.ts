import { clients, json } from "../_shared/admin.ts";
import { preflight } from "../_shared/cors.ts";

const SUPER_ADMIN_EMAIL = "fernandocroxiatti@gmail.com";

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    console.log("Authorization", request.headers.has("Authorization") ? "present" : "missing");
    const { user, service } = clients(request);
    const result = await user.auth.getUser();
    const authenticated = result.data.user;
    console.log("user", authenticated);
    console.error("auth error", result.error);
    if (result.error || !authenticated) return json({ error: "Unauthorized" }, 401);
    console.log("user email", authenticated.email);
    if ((authenticated.email ?? "").trim().toLowerCase() !== SUPER_ADMIN_EMAIL) return json({ is_admin: false });

    const existing = await service.from("platform_admins").select("id,active").eq("email", SUPER_ADMIN_EMAIL).order("created_at", { ascending: true });
    console.log("platform_admins result", existing.data);
    console.error("platform_admins query error", existing.error);
    if (existing.error) throw existing.error;
    if (existing.data.length > 1) return json({ error: "Multiple platform admin records found" }, 409);
    if (existing.data.length === 0) {
      const created = await service.from("platform_admins").insert({ email: SUPER_ADMIN_EMAIL, active: true }).select("id").single();
      if (created.error) {
        const retry = await service.from("platform_admins").select("id,active").eq("email", SUPER_ADMIN_EMAIL);
        if (retry.error) throw retry.error;
        if (retry.data.length > 1) return json({ error: "Multiple platform admin records found" }, 409);
        if (retry.data.length === 0) throw created.error;
      }
    } else if (!existing.data[0].active) {
      const activated = await service.from("platform_admins").update({ active: true }).eq("id", existing.data[0].id).eq("active", false);
      if (activated.error) throw activated.error;
    }

    return json({ is_admin: true });
  } catch (error) {
    console.error(error);
    console.error(error instanceof Error ? error.stack : undefined);
    const message = error instanceof Error ? error.message : "Erro interno";
    if (message === "Unauthorized") return json({ error: message }, 401);
    return json({ error: message }, 500);
  }
});
