import { clients, json } from "../_shared/admin.ts";
import { preflight } from "../_shared/cors.ts";

const SUPER_ADMIN_EMAIL = "fernandocroxiatti@gmail.com";

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const { user, service } = clients(request);
    const result = await user.auth.getUser();
    const authenticated = result.data.user;
    if (result.error || !authenticated) return json({ error: "Unauthorized" }, 401);
    if ((authenticated.email ?? "").trim().toLowerCase() !== SUPER_ADMIN_EMAIL) return json({ is_admin: false });

    const existing = await service.from("platform_admins").select("id,active").eq("email", SUPER_ADMIN_EMAIL).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) {
      const created = await service.from("platform_admins").insert({ email: SUPER_ADMIN_EMAIL, active: true }).select("id").single();
      if (created.error) {
        const retry = await service.from("platform_admins").select("id").eq("email", SUPER_ADMIN_EMAIL).maybeSingle();
        if (retry.error || !retry.data) throw created.error;
      }
    } else if (!existing.data.active) {
      const activated = await service.from("platform_admins").update({ active: true }).eq("id", existing.data.id).eq("active", false);
      if (activated.error) throw activated.error;
    }

    return json({ is_admin: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 400);
  }
});
