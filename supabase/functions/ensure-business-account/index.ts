import { clients, json } from "../_shared/admin.ts";
import { preflight } from "../_shared/cors.ts";

type Metadata = {
  business_name?: string;
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  postal_code?: string;
  address_number?: string;
  address_line?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number | null;
  longitude?: number | null;
  location_accuracy?: number | null;
  location_captured_at?: string | null;
};

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const { user, service } = clients(request);
    const authenticated = await user.auth.getUser();
    if (authenticated.error || !authenticated.data.user) return json({ error: "Unauthorized" }, 401);
    const authUser = authenticated.data.user;
    const metadata = (authUser.user_metadata ?? {}) as Metadata;
    if (metadata.business_name === undefined) return json({ error: "Conta não é empresarial" }, 400);

    const existing = await service.from("business_employees").select("business_id").eq("profile_id", authUser.id).eq("role", "owner").is("deleted_at", null).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return json({ business_id: existing.data.business_id, created: false });

    const business = await service.from("businesses").insert({ name: metadata.business_name.trim(), address_number: metadata.address_number ?? null, address_line: metadata.address_line ?? null, neighborhood: metadata.neighborhood ?? null, city: metadata.city ?? null, state: metadata.state ?? null, postal_code: metadata.postal_code ?? null, latitude: metadata.latitude ?? null, longitude: metadata.longitude ?? null, location_accuracy: metadata.location_accuracy ?? null, location_captured_at: metadata.location_captured_at ?? null, phone: metadata.phone ?? null, whatsapp: metadata.whatsapp ?? null, status: "inactive" }).select("id").single();
    if (business.error || !business.data) throw business.error ?? new Error("Não foi possível criar a empresa");
    const membership = await service.from("business_employees").insert({ business_id: business.data.id, profile_id: authUser.id, role: "owner", is_active: true, presence_status: "online" }).select("id").single();
    if (membership.error) {
      await service.from("businesses").delete().eq("id", business.data.id);
      throw membership.error;
    }
    return json({ business_id: business.data.id, employee_id: membership.data.id, created: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 400);
  }
});
