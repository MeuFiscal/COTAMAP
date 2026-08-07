import { createClient } from "@/lib/supabase/client";
import type { BusinessRow, QuotationRow } from "@/types/database";

export type CustomerQuotation = Omit<QuotationRow, "business"> & { business: BusinessRow | null; images: Array<{ id: string; storage_path: string; file_name: string | null }> };
export type CustomerOrder = { id: string; quotation_id: string; status: "pending" | "preparing" | "ready" | "completed" | "cancelled"; created_at: string; updated_at: string; quotation: CustomerQuotation | null };

export async function getCustomerQuotations(requestId?: string): Promise<CustomerQuotation[]> {
  const supabase = createClient(); const { data: session } = await supabase.auth.getSession(); if (!session.session) throw new Error("Sessão expirada.");
  let targetRequestId = requestId;
  if (!targetRequestId) { const latest = await supabase.from("quote_requests").select("id").eq("customer_id", session.session.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(); targetRequestId = latest.data?.id; }
  if (!targetRequestId) return [];
  const { data, error } = await supabase.from("quotations").select("*").eq("quote_request_id", targetRequestId).order("created_at", { ascending: false }); if (error) throw error;
  const businessIds = [...new Set(data.map((row) => row.business_id))]; const quotationIds = data.map((row) => row.id);
  const businesses = businessIds.length ? await supabase.from("businesses").select("*").in("id", businessIds) : { data: [], error: null }; if (businesses.error) throw businesses.error;
  const images = quotationIds.length ? await supabase.from("quotation_images").select("id,quotation_id,storage_path,file_name").in("quotation_id", quotationIds) : { data: [], error: null }; if (images.error) throw images.error;
  const businessMap = new Map((businesses.data ?? []).map((business) => [business.id, business])); const imageMap = new Map<string, Array<{ id: string; storage_path: string; file_name: string | null }>>();
  for (const image of images.data ?? []) imageMap.set(image.quotation_id, [...(imageMap.get(image.quotation_id) ?? []), image]);
  return data.map((quotation) => ({ ...quotation, business: businessMap.get(quotation.business_id) ?? null, images: imageMap.get(quotation.id) ?? [] }));
}

export async function chooseQuotation(quotationId: string): Promise<string> { const { data, error } = await createClient().functions.invoke("choose-quotation", { body: { quotation_id: quotationId } }); if (error) throw new Error(error.message); const result = data as { order: { id: string } }; return result.order.id; }

export async function getCustomerOrders(): Promise<CustomerOrder[]> { const supabase = createClient(); const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); if (error) throw error; const quotationIds = data.map((order) => order.quotation_id); if (!quotationIds.length) return []; const quotations = await supabase.from("quotations").select("*").in("id", quotationIds); if (quotations.error) throw quotations.error; const businessIds = [...new Set(quotations.data.map((quotation) => quotation.business_id))]; const businesses = businessIds.length ? await supabase.from("businesses").select("*").in("id", businessIds) : { data: [], error: null }; if (businesses.error) throw businesses.error; const map = new Map((businesses.data ?? []).map((business) => [business.id, business])); const quotationMap = new Map(quotations.data.map((quotation) => [quotation.id, { ...quotation, business: map.get(quotation.business_id) ?? null, images: [] }])); return data.map((order) => ({ ...order, quotation: quotationMap.get(order.quotation_id) ?? null })); }
