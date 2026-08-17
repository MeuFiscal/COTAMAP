import { createClient } from "@/lib/supabase/client";
import type { BusinessRow, OrderItemRow, QuotationItemRow, QuotationRow, QuoteRequestItemRow } from "@/types/database";

export type CustomerQuotation = Omit<QuotationRow, "business"> & {
  business: BusinessRow | null;
  distanceMeters: number | null;
  images: Array<{ id: string; storage_path: string; file_name: string | null }>;
  requestImages: Array<{ id: string; storage_path: string; file_name: string | null; url?: string }>;
  requestItems: QuoteRequestItemRow[];
  items: QuotationItemRow[];
};

export type CustomerOrder = {
  id: string;
  quotation_id: string;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
  quotation: CustomerQuotation | null;
  items: OrderItemRow[];
};

export async function getCustomerQuotations(requestId?: string): Promise<CustomerQuotation[]> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");

  let targetRequestId = requestId;
  if (!targetRequestId) {
    const latest = await supabase
      .from("quote_requests")
      .select("id")
      .eq("customer_id", session.session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    targetRequestId = latest.data?.id;
  }
  if (!targetRequestId) return [];

  const { data, error } = await supabase
    .from("quotations")
    .select("*")
    .eq("quote_request_id", targetRequestId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const request = await supabase.from("quote_requests").select("status").eq("id", targetRequestId).eq("customer_id", session.session.user.id).single();
  if (request.error) throw request.error;

  const businessIds = [...new Set(data.map((row) => row.business_id))];
  const quotationIds = data.map((row) => row.id);
  const notifications = await supabase.from("quote_notifications").select("business_id,distance_meters").eq("quote_request_id", targetRequestId).is("deleted_at", null);
  if (notifications.error) throw notifications.error;
  const businesses = businessIds.length
    ? await supabase.from("businesses").select("*").in("id", businessIds)
    : { data: [], error: null };
  if (businesses.error) throw businesses.error;

  const images = quotationIds.length
    ? await supabase.from("quotation_images").select("id,quotation_id,storage_path,file_name").in("quotation_id", quotationIds)
    : { data: [], error: null };
  if (images.error) throw images.error;

  const requestImages = await supabase
    .from("quote_request_images")
    .select("id,quote_request_id,storage_path,file_name")
    .eq("quote_request_id", targetRequestId)
    .is("deleted_at", null);
  if (requestImages.error) throw requestImages.error;
  const requestItems = await supabase.from("quote_request_items").select("*").eq("quote_request_id", targetRequestId).order("position");
  if (requestItems.error) throw requestItems.error;
  const quotationItems = quotationIds.length ? await supabase.from("quotation_items").select("*").in("quotation_id", quotationIds) : { data: [], error: null };
  if (quotationItems.error) throw quotationItems.error;

  const businessMap = new Map<string, BusinessRow>(
    (businesses.data ?? []).map((business) => [business.id, business]),
  );
  const distanceMap = new Map((notifications.data ?? []).map((notification) => [notification.business_id, notification.distance_meters]));
  const imageMap = new Map<string, Array<{ id: string; storage_path: string; file_name: string | null }>>();
  for (const image of images.data ?? []) {
    imageMap.set(image.quotation_id, [...(imageMap.get(image.quotation_id) ?? []), image]);
  }

  const signedRequestImages = await Promise.all(
    (requestImages.data ?? []).map(async (image) => {
      const signed = await supabase.storage.from("quote-request-images").createSignedUrl(image.storage_path, 3600);
      return {
        id: image.id,
        storage_path: image.storage_path,
        file_name: image.file_name,
        url: signed.data?.signedUrl ?? "",
      };
    }),
  );

  return data.map((quotation): CustomerQuotation => ({
    ...quotation,
    business: businessMap.get(quotation.business_id) ?? null,
    distanceMeters: distanceMap.get(quotation.business_id) ?? null,
    images: imageMap.get(quotation.id) ?? [],
    requestImages: signedRequestImages,
    requestItems: (requestItems.data ?? []) as QuoteRequestItemRow[],
    items: ((quotationItems.data ?? []) as QuotationItemRow[]).filter((item) => item.quotation_id === quotation.id),
  }));
}

export async function chooseQuotation(quotationId: string): Promise<string> {
  const { data, error } = await createClient().functions.invoke("choose-quotation", { body: { quotation_id: quotationId } });
  if (error) {
    let message = error.message;
    if ("context" in error && error.context instanceof Response) {
      try {
        const body = await error.context.clone().json() as { error?: string };
        if (body.error) message = body.error;
      } catch { /* keep the SDK message when the response is not JSON */ }
    }
    throw new Error(message);
  }
  const result = data as { order?: { id?: string } };
  if (!result.order?.id) throw new Error("Não foi possível criar o pedido a partir desta cotação.");
  return result.order.id;
}

export async function cancelQuoteRequest(requestId: string): Promise<void> {
  const { error } = await createClient().functions.invoke("cancel-quote-request", { body: { request_id: requestId } });
  if (error) {
    let message = error.message;
    if ("context" in error && error.context instanceof Response) {
      try {
        const body = await error.context.clone().json() as { error?: string };
        if (body.error) message = body.error;
      } catch { /* keep SDK message */ }
    }
    throw new Error(message);
  }
}

export async function getCustomerRequestStatus(requestId: string): Promise<string> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  const { data, error } = await supabase.from("quote_requests").select("status").eq("id", requestId).eq("customer_id", session.session.user.id).single();
  if (error) throw error;
  return data.status;
}

export async function getCustomerOrders(): Promise<CustomerOrder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id,quotation_id,status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;

  const quotationIds = data.map((order) => order.quotation_id);
  if (!quotationIds.length) return [];

  const quotations = await supabase.from("quotations").select("*").in("id", quotationIds).limit(100);
  if (quotations.error) throw quotations.error;

  const businessIds = [...new Set(quotations.data.map((quotation) => quotation.business_id))];
  const businesses = businessIds.length
    ? await supabase.from("businesses").select("*").in("id", businessIds).limit(100)
    : { data: [], error: null };
  if (businesses.error) throw businesses.error;

  const businessMap = new Map<string, BusinessRow>(
    (businesses.data ?? []).map((business) => [business.id, business]),
  );
  const quotationMap = new Map<string, CustomerQuotation>();
  const orderItems = await supabase.from("order_items").select("*").in("order_id", data.map((order) => order.id));
  if (orderItems.error) throw orderItems.error;

  for (const quotation of quotations.data) {
    const customerQuotation: CustomerQuotation = {
      ...quotation,
      business: businessMap.get(quotation.business_id) ?? null,
      distanceMeters: null,
      images: [],
      requestImages: [],
      requestItems: [],
      items: [],
    };
    quotationMap.set(quotation.id, customerQuotation);
  }

  return data.map((order): CustomerOrder => ({
    id: order.id,
    quotation_id: order.quotation_id,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
    quotation: quotationMap.get(order.quotation_id) ?? null,
    items: (orderItems.data ?? []).filter((item) => item.order_id === order.id) as OrderItemRow[],
  }));
}
