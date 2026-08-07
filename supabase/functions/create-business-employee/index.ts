import { actor, audit, clients, json } from "../_shared/admin.ts";

type Input = { business_id: string; email: string; full_name: string; phone?: string | null; role?: "manager" | "employee"; pin: string };

Deno.serve(async (request) => {
  let createdUserId: string | null = null;
  let businessId: string | null = null;
  let actorId: string | null = null;
  let service: ReturnType<typeof clients>["service"] | null = null;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const clientsResult = clients(request);
    service = clientsResult.service;
    const body = await request.json() as Input;
    businessId = body.business_id;
    if (!/^[0-9]{4}([0-9]{2})?$/.test(body.pin) || !body.email || !body.full_name) return json({ error: "Dados inválidos" }, 400);
    const authenticatedActor = await actor(service, clientsResult.user, body.business_id);
    actorId = authenticatedActor.id;
    const created = await service.auth.admin.createUser({ email: body.email, email_confirm: true, user_metadata: { full_name: body.full_name, phone: body.phone ?? null, role: "employee" } });
    if (created.error || !created.data.user) return json({ error: created.error?.message ?? "Não foi possível criar usuário" }, 400);
    createdUserId = created.data.user.id;
    const profile = await service.from("profiles").update({ full_name: body.full_name, phone: body.phone ?? null, role: body.role ?? "employee" }).eq("id", createdUserId);
    if (profile.error) throw profile.error;
    const hash = await service.rpc("hash_operator_pin", { input_pin: body.pin });
    if (hash.error || !hash.data) throw hash.error ?? new Error("Não foi possível proteger o PIN");
    const membership = await service.from("business_employees").insert({ business_id: body.business_id, profile_id: createdUserId, role: body.role ?? "employee", is_active: true, pin_hash: hash.data }).select("id").single();
    if (membership.error) throw membership.error;
    await audit(service, authenticatedActor.id, body.business_id, "created", membership.data.id, { employee_profile_id: createdUserId });
    return json({ employee_id: membership.data.id });
  } catch (error) {
    if (service && createdUserId) {
      const cleanup = await service.auth.admin.deleteUser(createdUserId);
      if (cleanup.error && businessId) {
        await service.from("audit_logs").insert({ actor_profile_id: actorId, entity_type: "business_employee", action: "reconciliation_required", metadata: { business_id: businessId, auth_user_id: createdUserId, error: cleanup.error.message } });
      }
    }
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 400);
  }
});
