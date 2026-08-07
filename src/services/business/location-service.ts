import { createClient } from "@/lib/supabase/client";
import { getCurrentBusinessId } from "@/services/business/business-service";
export type BusinessLocation = { latitude: number | null; longitude: number | null; updatedAt: string | null };
export async function getBusinessLocation(): Promise<BusinessLocation> { const supabase = createClient(); const id = await getCurrentBusinessId(); const { data, error } = await supabase.from("businesses").select("latitude,longitude,updated_at").eq("id", id).single(); if (error) throw error; return { latitude: data.latitude, longitude: data.longitude, updatedAt: data.updated_at }; }
export async function saveBusinessLocation(latitude: number, longitude: number): Promise<void> { const supabase = createClient(); const id = await getCurrentBusinessId(); const { error } = await supabase.from("businesses").update({ latitude, longitude }).eq("id", id); if (error) throw error; }
