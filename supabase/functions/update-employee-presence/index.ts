import { clients } from "../_shared/admin.ts";
import { json, preflight } from "../_shared/cors.ts";

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    const { user, service } = clients(request);
    const auth = await user.auth.getUser();
    if (!auth.data.user) return json({ error: "Unauthorized" }, 401);
    const body = await request.json() as { employee_id?: string; business_id?: string; presence_status?: "online" | "away" | "offline" };
    if (!body.employee_id || !body.presence_status || !["online", "away", "offline"].includes(body.presence_status)) return json({ error: "Dados de presença inválidos" }, 400);

    const actor = await service.from("business_employees")
      .select("business_id,role")
      .eq("profile_id", auth.data.user.id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    if (actor.error || !actor.data) return json({ error: "Usuário não vinculado a uma empresa" }, 403);

    const businessId = body.business_id ?? actor.data.business_id;
    if (businessId !== actor.data.business_id && !["admin"].includes(actor.data.role)) return json({ error: "Empresa inválida" }, 403);

    const target = await service.from("business_employees")
      .select("id,profile_id")
      .eq("id", body.employee_id)
      .eq("business_id", businessId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();
    if (target.error || !target.data) return json({ error: "Operador não encontrado" }, 404);

    const canUpdate = target.data.profile_id === auth.data.user.id || ["owner", "manager", "admin"].includes(actor.data.role);
    if (!canUpdate) return json({ error: "Sem permissão para alterar este operador" }, 403);

    const now = new Date().toISOString();
    const updated = await service.from("business_employees")
      .update({ presence_status: body.presence_status, last_activity_at: now, last_access_at: now })
      .eq("id", body.employee_id).eq("business_id", businessId);
    if (updated.error) throw updated.error;
    return json({ success: true, presence_status: body.presence_status, updated_at: now });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 400);
  }
});
