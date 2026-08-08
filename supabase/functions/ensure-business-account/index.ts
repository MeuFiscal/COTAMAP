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

const DEFAULT_OPENING_HOURS = {
  monday: { open: "00:00", close: "23:59" },
  tuesday: { open: "00:00", close: "23:59" },
  wednesday: { open: "00:00", close: "23:59" },
  thursday: { open: "00:00", close: "23:59" },
  friday: { open: "00:00", close: "23:59" },
  saturday: { open: "00:00", close: "23:59" },
  sunday: { open: "00:00", close: "23:59" }
};

Deno.serve(async (request) => {
  const cors = preflight(request);
  if (cors) return cors;

  try {
    if (request.method !== "POST") {
      return json({ error: "Method Not Allowed" }, 405);
    }

    const { user, service } = clients(request);

    const authenticated = await user.auth.getUser();

    if (authenticated.error || !authenticated.data.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const authUser = authenticated.data.user;
    const metadata = (authUser.user_metadata ?? {}) as Metadata;

    const businessName =
      metadata.business_name?.trim() ||
      metadata.full_name?.trim() ||
      authUser.email?.split("@")[0]?.trim() ||
      "Empresa CotaMap";

    const latitude =
      typeof metadata.latitude === "number" && Number.isFinite(metadata.latitude)
        ? metadata.latitude
        : null;

    const longitude =
      typeof metadata.longitude === "number" && Number.isFinite(metadata.longitude)
        ? metadata.longitude
        : null;

    const openingHours = DEFAULT_OPENING_HOURS;

    const existing = await service
      .from("business_employees")
      .select("id,business_id")
      .eq("profile_id", authUser.id)
      .eq("role", "owner")
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing.error) throw existing.error;

    if (existing.data?.business_id) {
      const businessUpdate: Record<string, unknown> = {
        name: businessName,
        status: "active",
        address_number: metadata.address_number ?? null,
        address_line: metadata.address_line ?? null,
        neighborhood: metadata.neighborhood ?? null,
        city: metadata.city ?? null,
        state: metadata.state ?? null,
        postal_code: metadata.postal_code ?? null,
        phone: metadata.phone ?? null,
        whatsapp: metadata.whatsapp ?? null,
        opening_hours: openingHours,
        latitude,
        longitude,
        location_accuracy: metadata.location_accuracy ?? null,
        location_captured_at: metadata.location_captured_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (latitude !== null && longitude !== null) {
        businessUpdate.location =
          `SRID=4326;POINT(${longitude} ${latitude})`;
      }

      const updated = await service
        .from("businesses")
        .update(businessUpdate)
        .eq("id", existing.data.business_id)
        .select("id")
        .single();

      if (updated.error) throw updated.error;

      const employeeUpdate = await service
        .from("business_employees")
        .update({
          is_active: true,
          presence_status: "online",
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.data.id);

      if (employeeUpdate.error) throw employeeUpdate.error;

      return json({
        business_id: existing.data.business_id,
        employee_id: existing.data.id,
        created: false,
        active: true
      });
    }

    const businessPayload: Record<string, unknown> = {
      name: businessName,
      address_number: metadata.address_number ?? null,
      address_line: metadata.address_line ?? null,
      neighborhood: metadata.neighborhood ?? null,
      city: metadata.city ?? null,
      state: metadata.state ?? null,
      postal_code: metadata.postal_code ?? null,
      phone: metadata.phone ?? null,
      whatsapp: metadata.whatsapp ?? null,
      latitude,
      longitude,
      opening_hours: openingHours,
      status: "active",
      location_accuracy: metadata.location_accuracy ?? null,
      location_captured_at:
        metadata.location_captured_at ?? new Date().toISOString()
    };

    if (latitude !== null && longitude !== null) {
      businessPayload.location =
        `SRID=4326;POINT(${longitude} ${latitude})`;
    }

    const business = await service
      .from("businesses")
      .insert(businessPayload)
      .select("id")
      .single();

    if (business.error || !business.data) {
      throw business.error ?? new Error("Não foi possível criar a empresa");
    }

    const membership = await service
      .from("business_employees")
      .insert({
        business_id: business.data.id,
        profile_id: authUser.id,
        role: "owner",
        is_active: true,
        presence_status: "online",
        last_access_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (membership.error || !membership.data) {
      await service
        .from("businesses")
        .delete()
        .eq("id", business.data.id);

      throw membership.error ?? new Error("Não foi possível criar o proprietário");
    }

    return json({
      business_id: business.data.id,
      employee_id: membership.data.id,
      created: true,
      active: true
    });
  } catch (error) {
    console.error("ensure-business-account:", error);

    return json(
      {
        error: error instanceof Error ? error.message : "Erro interno"
      },
      400
    );
  }
});
