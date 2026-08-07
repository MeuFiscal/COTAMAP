import { createClient } from "@/lib/supabase/client";
import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";
import type { QuoteRequestRow } from "@/types/database";

type CreateQuoteResponse = { request: QuoteRequestRow; notifications: Array<{ id: string; business_id: string; status: string }> };

function ensureCoordinates(position: GeolocationPosition): { latitude: number; longitude: number } {
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

async function getCoordinates(): Promise<{ latitude: number; longitude: number }> {
  if (!navigator.geolocation) throw new Error("A localização é necessária para buscar empresas próximas.");
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition((position) => resolve(ensureCoordinates(position)), () => reject(new Error("Permita o acesso à localização para continuar.")), { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }));
}

export async function createRealQuoteRequest(values: NewQuoteFormData, photo: File | null): Promise<CreateQuoteResponse> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error("Sua sessão expirou. Entre novamente para solicitar uma cotação.");
  const coordinates = await getCoordinates();
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
    },
  });
  if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a solicitação.");
  return data;
}
