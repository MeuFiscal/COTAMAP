import { createClient } from "@/lib/supabase/client";
import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";
import type { QuoteRequestRow } from "@/types/database";

type CreateQuoteResponse = { request: QuoteRequestRow; notifications: Array<{ id: string; business_id: string; status: string }> };
export type QuoteRequestDraft = {
  values: NewQuoteFormData;
  coordinates: { latitude: number; longitude: number };
};

function ensureCoordinates(position: GeolocationPosition): { latitude: number; longitude: number } {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

async function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
  if (!navigator.geolocation) throw new Error("A localização é necessária para buscar empresas próximas.");
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => resolve(ensureCoordinates(position)), () => reject(new Error("Permita o acesso à localização para continuar.")), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }));
}

export async function getQuoteRequestDraft(requestId: string): Promise<QuoteRequestDraft> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  const { data, error } = await supabase
    .from("quote_requests")
    .select("part_name,vehicle_brand,vehicle_model,vehicle_year,vehicle_engine,observation,radius_meters,latitude,longitude")
    .eq("id", requestId)
    .eq("customer_id", userData.user.id)
    .is("deleted_at", null)
    .single();
  if (error || !data) throw new Error("Solicitação não encontrada para esta conta.");
  const requestItems = await supabase.from("quote_request_items").select("name,brand,quantity,unit,notes").eq("quote_request_id", requestId).order("position");
  if (requestItems.error) throw requestItems.error;
  const row = data as Pick<QuoteRequestRow, "part_name" | "vehicle_brand" | "vehicle_model" | "vehicle_year" | "vehicle_engine" | "observation" | "radius_meters" | "latitude" | "longitude">;
  const radius = row.radius_meters / 1000;
  const allowedRadius = ([5, 10, 20, 50] as const).find((value) => value === radius) ?? 10;
  return {
    values: {
      partName: row.part_name ?? "",
      brand: row.vehicle_brand ?? "",
      vehicleModel: row.vehicle_model ?? "",
      vehicleYear: row.vehicle_year ? String(row.vehicle_year) : "",
      vehicleEngine: row.vehicle_engine ?? "",
      notes: row.observation ?? "",
      radius: allowedRadius,
      items: (requestItems.data ?? []).map((item) => ({ name: item.name, brand: item.brand ?? "", quantity: Number(item.quantity), unit: item.unit ?? "", notes: item.notes ?? "" })),
    },
    coordinates: { latitude: row.latitude, longitude: row.longitude },
  };
}

export async function createRealQuoteRequest(values: NewQuoteFormData, photo: File | null, restoredCoordinates?: { latitude: number; longitude: number } | null): Promise<CreateQuoteResponse> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Sua sessão expirou. Entre novamente para solicitar uma cotação.");
  const coordinates = restoredCoordinates ?? await getCoordinates();
  let temporaryPath: string | null = null;
  if (photo) {
    temporaryPath = `${sessionData.session.user.id}/pending/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("quote-request-images").upload(temporaryPath, photo, { contentType: photo.type, upsert: false });
    if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  }
  const { data, error } = await supabase.functions.invoke<CreateQuoteResponse>("create-quote-request", {
    body: {
      part_name: values.partName,
      vehicle_brand: values.brand || null,
      vehicle_model: values.vehicleModel || null,
      vehicle_year: values.vehicleYear ? Number(values.vehicleYear) : null,
      vehicle_engine: values.vehicleEngine || null,
      observation: values.notes || null,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radius_meters: values.radius * 1000,
      image_path: temporaryPath,
      image_file_name: photo?.name ?? null,
      image_mime_type: photo?.type ?? null,
      image_size_bytes: photo?.size ?? null,
      items: values.items?.length ? values.items : [{ name: values.partName, brand: values.brand || null, quantity: 1, notes: values.notes || null }],
    },
  });
  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a solicitação.");
  return data;
}
