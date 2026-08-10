import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";

export type BusinessRegistration = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  addressLine: string | null;
  addressNumber: string | null;
  neighborhood: string | null;
  postalCode: string | null;
  city: string | null;
  state: string | null;
};

export async function getBusinessRegistration(): Promise<BusinessRegistration> {
  const supabase = createClient();
  const id = await getCurrentBusinessId();
  const { data, error } = await supabase.from("businesses").select("*").eq("id", id).single();
  if (error) throw error;
  const row = data as unknown as { id: string; name: string; phone: string | null; whatsapp: string | null; address_line: string | null; address_number: string | null; neighborhood: string | null; postal_code: string | null; city: string | null; state: string | null };
  return { id: row.id, name: row.name, phone: row.phone, whatsapp: row.whatsapp, addressLine: row.address_line, addressNumber: row.address_number, neighborhood: row.neighborhood, postalCode: row.postal_code, city: row.city, state: row.state };
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
