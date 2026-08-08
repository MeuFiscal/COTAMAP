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

const errorMessage = (error: unknown) => error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String(error.message) : "Erro interno";

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
    if (profile.error) throw new Error(`Não foi possível verificar o perfil: ${profile.error.message}`);
    if (!profile.data) {
      const createdProfile = await service.from("profiles").insert({ id: authUser.id, full_name: String(metadata.full_name ?? businessName), email: authUser.email ?? String(metadata.email ?? ""), phone: metadata.phone ? String(metadata.phone) : null }).select("id").single();
      if (createdProfile.error && !createdProfile.error.message.toLowerCase().includes("duplicate")) throw new Error(`Não foi possível criar o perfil: ${createdProfile.error.message}`);
    }

    const existing = await service.from("business_employees").select("id,business_id").eq("profile_id", authUser.id).eq("role", "owner").eq("is_active", true).is("deleted_at", null);
    if (existing.error) throw new Error(`Não foi possível verificar a empresa existente: ${existing.error.message}`);
    if (existing.data.length > 1) return json({ error: "Mais de uma empresa ativa foi encontrada para este proprietário." }, 409);
    if (existing.data[0]) return json({ business_id: existing.data[0].business_id, employee_id: existing.data[0].id, created: false, active: true });

    const payload = {
      name: businessName, address_number: metadata.address_number ? String(metadata.address_number) : null, address_line: metadata.address_line ? String(metadata.address_line) : null,
      neighborhood: metadata.neighborhood ? String(metadata.neighborhood) : null, city: metadata.city ? String(metadata.city) : null, state,
      postal_code: metadata.postal_code ? String(metadata.postal_code) : null, country_code: "BR", phone: metadata.phone ? String(metadata.phone) : null,
      whatsapp: metadata.whatsapp ? String(metadata.whatsapp) : null, latitude, longitude, location_accuracy: metadata.location_accuracy ?? null,
      location_captured_at: metadata.location_captured_at ?? null, opening_hours: {}, status: "inactive" as const,
    };
    const business = await service.from("businesses").insert(payload).select("id").single();
    if (business.error || !business.data) throw new Error(`Não foi possível criar a empresa: ${business.error?.message ?? "resposta inválida"}`);

    const membership = await service.from("business_employees").insert({ business_id: business.data.id, profile_id: authUser.id, role: "owner", is_active: true }).select("id").single();
    if (membership.error || !membership.data) {
      const retry = await service.from("business_employees").select("id,business_id").eq("profile_id", authUser.id).eq("role", "owner").eq("is_active", true).is("deleted_at", null);
      if (retry.data?.[0]) return json({ business_id: retry.data[0].business_id, employee_id: retry.data[0].id, created: false, active: true });
      throw new Error(`Empresa criada, mas não foi possível criar o proprietário: ${membership.error?.message ?? "resposta inválida"}`);
    }
    return json({ business_id: business.data.id, employee_id: membership.data.id, created: true, active: false });
  } catch (error) {
    console.error("ensure-business-account", error);
    console.error(error instanceof Error ? error.stack : undefined);
    return json({ error: errorMessage(error) }, 500);
  }
});
