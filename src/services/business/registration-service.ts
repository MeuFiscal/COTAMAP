import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

export type BusinessRegistration = {
  id: string;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
  openingHours: Record<string, { open: string; close: string; enabled: boolean }>;
  categoryId: string | null;
};

export async function getBusinessRegistration(): Promise<BusinessRegistration> {
  const supabase = createClient();
  const id = await getCurrentBusinessId();
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single();
  if (error) throw error;
  const row = data as unknown as { id: string; name: string; logo_url: string | null; phone: string | null; whatsapp: string | null; address_line: string | null; address_number: string | null; neighborhood: string | null; postal_code: string | null; city: string | null; state: string | null; opening_hours: Record<string, { open: string; close: string; enabled: boolean }> | null; business_category_id: string | null };
  return { id: row.id, name: row.name, logoUrl: row.logo_url, phone: row.phone, whatsapp: row.whatsapp, addressLine: row.address_line, addressNumber: row.address_number, neighborhood: row.neighborhood, postalCode: row.postal_code, city: row.city, state: row.state, openingHours: row.opening_hours ?? {}, categoryId: row.business_category_id };
}

export async function updateBusinessHours(openingHours: BusinessRegistration["openingHours"]): Promise<void> {
  const supabase = createClient();
  const id = await getCurrentBusinessId();
  const { error } = await supabase.from("businesses").update({ opening_hours: openingHours } as never).eq("id", id);
  if (error) throw error;
}

export async function updateBusinessCategory(categoryId: string | null): Promise<void> {
  const supabase = createClient();
  const id = await getCurrentBusinessId();
  const { error } = await supabase.from("businesses").update({ business_category_id: categoryId } as never).eq("id", id);
  if (error) throw error;
}

export type BusinessRegistrationInput = {
  name: string;
  phone: string;
  whatsapp: string;
  addressLine: string;
  addressNumber: string;
  neighborhood: string;
  postalCode: string;
  city: string;
  state: string;
};

export async function updateBusinessRegistration(input: BusinessRegistrationInput): Promise<void> {
  const supabase = createClient();
  const id = await getCurrentBusinessId();
  const payload = { name: input.name.trim(), phone: input.phone?.trim() || null, whatsapp: input.whatsapp?.trim() || null, address_line: input.addressLine?.trim() || null, address_number: input.addressNumber?.trim() || null, neighborhood: input.neighborhood?.trim() || null, postal_code: input.postalCode?.trim() || null, city: input.city?.trim() || null, state: input.state?.trim().toUpperCase() || null };
  const { error } = await supabase.from("businesses").update(payload as never).eq("id", id);
  if (error) throw error;
}

const LOGO_BUCKET = "business-logos";

export async function uploadBusinessLogo(blob: Blob): Promise<string> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const path = `${businessId}/logo.webp`;
  const uploaded = await supabase.storage.from(LOGO_BUCKET).upload(path, blob, { contentType: "image/webp", upsert: true });
  if (uploaded.error) throw uploaded.error;
  const publicUrl = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("businesses").update({ logo_url: publicUrl } as never).eq("id", businessId);
  if (error) throw error;
  return publicUrl;
}

export async function removeBusinessLogo(): Promise<void> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const removed = await supabase.storage.from(LOGO_BUCKET).remove([`${businessId}/logo.webp`]);
  if (removed.error) throw removed.error;
  const { error } = await supabase.from("businesses").update({ logo_url: null } as never).eq("id", businessId);
  if (error) throw error;
}
