import { clients, json } from "../_shared/admin.ts";
import { preflight } from "../_shared/cors.ts";

type Metadata = Record<string, unknown> & {
  business_name?: string; full_name?: string; email?: string; phone?: string; whatsapp?: string;
  postal_code?: string; address_number?: string; address_line?: string; neighborhood?: string;
  city?: string; state?: string; latitude?: number | null; longitude?: number | null;
  location_accuracy?: number | null; location_captured_at?: string | null;
};

const STATE_UF: Record<string, string> = {
  acre: "AC", alagoas: "AL", amapá: "AP", amapa: "AP", amazonas: "AM", bahia: "BA", ceará: "CE", ceara: "CE",
  "distrito federal": "DF", "espírito santo": "ES", "espirito santo": "ES", goiás: "GO", goias: "GO", maranhão: "MA", maranhao: "MA",
  "mato grosso": "MT", "mato grosso do sul": "MS", "minas gerais": "MG", pará: "PA", para: "PA", paraíba: "PB", paraiba: "PB",
  paraná: "PR", parana: "PR", pernambuco: "PE", piauí: "PI", piaui: "PI", "rio de janeiro": "RJ", "rio grande do norte": "RN",
  "rio grande do sul": "RS", rondônia: "RO", rondonia: "RO", roraima: "RR", "santa catarina": "SC", "são paulo": "SP", "sao paulo": "SP",
  sergipe: "SE", tocantins: "TO",
};

const normalizeState = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 2 ? normalized.toUpperCase() : STATE_UF[normalized] ?? null;
};

type DatabaseError = { message?: string; code?: string; details?: string; hint?: string };

const errorMessage = (error: unknown) => error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String(error.message) : "Erro interno";

const dbFailure = (operation: string, error: DatabaseError): Error & { details: Record<string, unknown> } => {
  const failure = new Error(`${operation}: ${error.message ?? "erro do banco"}`) as Error & { details: Record<string, unknown> };
  failure.details = { operation, code: error.code ?? null, message: error.message ?? null, details: error.details ?? null, hint: error.hint ?? null };
  return failure;
};

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;
  try {
    if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);
    const { user, service } = clients(request);
    const authenticated = await user.auth.getUser();
    if (authenticated.error || !authenticated.data.user) return json({ error: "Sessão inválida ou expirada." }, 401);

    const authUser = authenticated.data.user;
    const metadata = (authUser.user_metadata ?? {}) as Metadata;
    const latitude = typeof metadata.latitude === "number" && Number.isFinite(metadata.latitude) ? metadata.latitude : null;
    const longitude = typeof metadata.longitude === "number" && Number.isFinite(metadata.longitude) ? metadata.longitude : null;
    const state = normalizeState(metadata.state);
    const businessName = String(metadata.business_name ?? metadata.full_name ?? authUser.email?.split("@")[0] ?? "Empresa CotaMap").trim();

    const profile = await service.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
    if (profile.error) throw dbFailure("profiles.select", profile.error);
    if (!profile.data) {
      const createdProfile = await service.from("profiles").insert({ id: authUser.id, full_name: String(metadata.full_name ?? businessName), email: authUser.email ?? String(metadata.email ?? ""), phone: metadata.phone ? String(metadata.phone) : null }).select("id").single();
      if (createdProfile.error && !createdProfile.error.message.toLowerCase().includes("duplicate")) throw dbFailure("profiles.insert", createdProfile.error);
    }

    const existing = await service.from("business_employees").select("id,business_id,is_active").eq("profile_id", authUser.id).eq("role", "owner").is("deleted_at", null);
    if (existing.error) throw dbFailure("business_employees.select", existing.error);
    if (existing.data.length > 1) return json({ error: "Mais de uma empresa ativa foi encontrada para este proprietário." }, 409);
    if (existing.data[0]) {
      const owner = existing.data[0];
      if (!owner.is_active) {
        const reactivated = await service.from("business_employees").update({ is_active: true }).eq("id", owner.id);
        if (reactivated.error) throw dbFailure("business_employees.reactivate", reactivated.error);
      }
      return json({ business_id: owner.business_id, employee_id: owner.id, created: false, reused: true, active: true });
    }

    const payload = {
      name: businessName, address_number: metadata.address_number ? String(metadata.address_number) : null, address_line: metadata.address_line ? String(metadata.address_line) : null,
      neighborhood: metadata.neighborhood ? String(metadata.neighborhood) : null, city: metadata.city ? String(metadata.city) : null, state,
      postal_code: metadata.postal_code ? String(metadata.postal_code) : null, country_code: "BR", phone: metadata.phone ? String(metadata.phone) : null,
      whatsapp: metadata.whatsapp ? String(metadata.whatsapp) : null, latitude, longitude, location_accuracy: metadata.location_accuracy ?? null,
      location_captured_at: metadata.location_captured_at ?? null, opening_hours: {}, status: "inactive" as const,
    };
    const business = await service.from("businesses").insert(payload).select("id").single();
    if (business.error || !business.data) throw dbFailure("businesses.insert", business.error ?? { message: "resposta inválida" });

    const membership = await service.from("business_employees").insert({ business_id: business.data.id, profile_id: authUser.id, role: "owner", is_active: true }).select("id").single();
    if (membership.error || !membership.data) {
      const retry = await service.from("business_employees").select("id,business_id").eq("profile_id", authUser.id).eq("role", "owner").eq("is_active", true).is("deleted_at", null);
      if (retry.data?.[0]) return json({ business_id: retry.data[0].business_id, employee_id: retry.data[0].id, created: false, active: true });
      throw dbFailure("business_employees.insert", membership.error ?? { message: "resposta inválida" });
    }
    return json({ business_id: business.data.id, employee_id: membership.data.id, created: true, active: false });
  } catch (error) {
    console.error("ensure-business-account", error);
    console.error(error instanceof Error ? error.stack : undefined);
    const details = error instanceof Error && "details" in error ? (error as Error & { details: Record<string, unknown> }).details : undefined;
    return json({ error: errorMessage(error), ...(details ? { details } : {}) }, 500);
  }
});
