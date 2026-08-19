import { createClient } from "@/lib/supabase/client";
import type { QuoteNotificationRow, QuoteRequestRow } from "@/types/database";

export type BusinessMembership = { id: string; business_id: string; profile_id: string; role: string; is_active: boolean };
export type AvailableBusiness = { id: string; name: string; logo_url: string | null; is_available_for_requests: boolean; availability_updated_at: string | null };

function selectedBusinessKey(userId: string): string { return `cotamap:selected-business:v1:${userId}`; }

async function getSessionAndMemberships() {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  const { data, error } = await supabase.from("business_employees")
    .select("id,business_id,profile_id,role,is_active")
    .eq("profile_id", session.session.user.id)
    .eq("is_active", true)
    .is("deleted_at", null);
  if (error) throw error;
  return { supabase, userId: session.session.user.id, memberships: (data ?? []) as BusinessMembership[] };
}

export async function getAvailableBusinesses(): Promise<AvailableBusiness[]> {
  const { supabase, memberships } = await getSessionAndMemberships();
  const ids = [...new Set(memberships.map((membership) => membership.business_id))];
  if (!ids.length) return [];
  const { data, error } = await supabase.from("businesses")
    .select("id,name,logo_url,is_available_for_requests,availability_updated_at")
    .in("id", ids)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []) as AvailableBusiness[];
}

export async function getPersistedBusinessId(): Promise<string | null> {
  const { userId, memberships } = await getSessionAndMemberships();
  const stored = typeof window === "undefined" ? null : window.sessionStorage.getItem(selectedBusinessKey(userId));
  if (!stored) return null;
  if (memberships.some((membership) => membership.business_id === stored)) return stored;
  if (typeof window !== "undefined") window.sessionStorage.removeItem(selectedBusinessKey(userId));
  return null;
}

export async function getSelectedBusinessId(): Promise<string | null> {
  const { userId, memberships } = await getSessionAndMemberships();
  const stored = typeof window === "undefined" ? null : window.sessionStorage.getItem(selectedBusinessKey(userId));
  if (stored && memberships.some((membership) => membership.business_id === stored)) return stored;
  if (stored && typeof window !== "undefined") window.sessionStorage.removeItem(selectedBusinessKey(userId));
  if (memberships.length === 1) {
    if (typeof window !== "undefined") window.sessionStorage.setItem(selectedBusinessKey(userId), memberships[0].business_id);
    return memberships[0].business_id;
  }
  return null;
}

export async function setSelectedBusinessId(businessId: string): Promise<void> {
  const { userId, memberships } = await getSessionAndMemberships();
  if (!memberships.some((membership) => membership.business_id === businessId)) throw new Error("Empresa inválida.");
  if (typeof window === "undefined") throw new Error("Seleção de empresa indisponível.");
  window.sessionStorage.setItem(selectedBusinessKey(userId), businessId);
}

export async function clearSelectedBusinessId(): Promise<void> {
  const { userId } = await getSessionAndMemberships();
  if (typeof window !== "undefined") window.sessionStorage.removeItem(selectedBusinessKey(userId));
}

export async function getBusinessEmployees() {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data, error } = await supabase.from("business_employees").select("id, business_id, profile_id, role, is_active, presence_status, profiles(full_name,email)").eq("business_id", businessId).eq("is_active", true).is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return { ...row, full_name: profile?.full_name ?? null, email: profile?.email ?? null };
  });
}

export async function getBusinessEmployeesForBusiness(businessId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from("business_employees").select("id, business_id, profile_id, role, is_active, presence_status, profiles(full_name,email)").eq("business_id", businessId).eq("is_active", true).is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return { ...row, full_name: profile?.full_name ?? null, email: profile?.email ?? null };
  });
}

export async function verifyEmployeePin(employeeId: string, pin: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("verify_employee_pin", { target_employee_id: employeeId, submitted_pin: pin });
  if (error) throw error;
  return Boolean(data);
}

export async function getEmployeePinConfigured(employeeId: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("get_employee_pin_status", { target_employee_id: employeeId });
  if (error) throw error;
  return Boolean(data);
}

export async function setInitialEmployeePin(employeeId: string, pin: string): Promise<boolean> {
  const { data, error } = await createClient().rpc("set_initial_employee_pin", { target_employee_id: employeeId, submitted_pin: pin });
  if (error) throw error;
  return Boolean(data);
}

export async function getCurrentBusinessId(): Promise<string> {
  const businessId = await getSelectedBusinessId();
  if (!businessId) throw new Error("Selecione uma empresa para continuar.");
  return businessId;
}

export async function getBusinessCalls(): Promise<Array<{ notification: QuoteNotificationRow; request: QuoteRequestRow; items: Array<{ id: string; name: string; brand: string | null; quantity: number; unit: string | null; notes: string | null }>; images: Array<{ url: string; fileName: string | null }> }>> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data: notifications, error } = await supabase.from("quote_notifications").select("*").eq("business_id", businessId).is("deleted_at", null).in("status", ["pending", "sent"]).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  if (!notifications.length) return [];
  const requestIds = [...new Set(notifications.map((item) => item.quote_request_id))];
  const { data: requests, error: requestError } = await supabase.from("quote_requests").select("*").in("id", requestIds).eq("status", "waiting").is("deleted_at", null).limit(100);
  if (requestError) throw requestError;
  const byId = new Map(requests.map((request) => [request.id, request]));
  const requestIdsWithImages = requests.map((request) => request.id);
  const { data: requestItems, error: itemError } = requestIdsWithImages.length ? await supabase.from("quote_request_items").select("id,quote_request_id,name,brand,quantity,unit,notes,position").in("quote_request_id", requestIdsWithImages).order("position") : { data: [], error: null };
  if (itemError) throw itemError;
  const itemsMap = new Map<string, Array<{ id: string; name: string; brand: string | null; quantity: number; unit: string | null; notes: string | null }>>();
  for (const item of requestItems ?? []) itemsMap.set(item.quote_request_id, [...(itemsMap.get(item.quote_request_id) ?? []), item]);
  const { data: images, error: imagesError } = requestIdsWithImages.length ? await supabase.from("quote_request_images").select("quote_request_id,storage_path,file_name").in("quote_request_id", requestIdsWithImages).is("deleted_at", null) : { data: [], error: null };
  if (imagesError) throw imagesError;
  const imageMap = new Map<string, Array<{ url: string; fileName: string | null }>>();
  for (const image of images ?? []) {
    const signed = await supabase.storage.from("quote-request-images").createSignedUrl(image.storage_path, 3600);
    if (!signed.error && signed.data?.signedUrl) imageMap.set(image.quote_request_id, [...(imageMap.get(image.quote_request_id) ?? []), { url: signed.data.signedUrl, fileName: image.file_name }]);
  }
  return notifications.flatMap((notification) => { const request = byId.get(notification.quote_request_id); return request ? [{ notification, request, items: itemsMap.get(request.id) ?? [], images: imageMap.get(request.id) ?? [] }] : []; });
}

export type BusinessCallStatus = { notificationStatus: string; requestStatus: string } | null;

export async function getBusinessCallStatus(notificationId: string): Promise<BusinessCallStatus> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data: notification, error } = await supabase.from("quote_notifications").select("id,status,quote_request_id").eq("id", notificationId).eq("business_id", businessId).maybeSingle();
  if (error) throw error;
  if (!notification) return null;
  const { data: request, error: requestError } = await supabase.from("quote_requests").select("status").eq("id", notification.quote_request_id).maybeSingle();
  if (requestError) throw requestError;
  return request ? { notificationStatus: notification.status, requestStatus: request.status } : null;
}

export async function updateEmployeePresence(employeeId: string, presenceStatus: "online" | "offline", businessId?: string): Promise<void> {
  const { error } = await createClient().functions.invoke("update-employee-presence", { body: { employee_id: employeeId, business_id: businessId, presence_status: presenceStatus } });
  if (error) throw error;
}

export async function respondToQuotation(input: { notificationId: string; businessId: string; action: "accept" | "reject"; amount?: number; notes?: string; availability?: string; pickupMinutes?: number; image?: File | null; items?: Array<{ quote_request_item_id: string; available: boolean; unit_price: number; quantity?: number; notes?: string }> }): Promise<void> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  let imagePath: string | null = null;
  if (input.image) {
    imagePath = `${input.businessId}/${input.notificationId}/${crypto.randomUUID()}-${input.image.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("quotation-images").upload(imagePath, input.image, { contentType: input.image.type, upsert: false });
    if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  }
  const { error } = await supabase.functions.invoke("respond-quotation", { body: { notification_id: input.notificationId, action: input.action, amount: input.amount, items: input.items, notes: [input.availability, input.notes].filter(Boolean).join(" · "), response_time_seconds: input.pickupMinutes ? input.pickupMinutes * 60 : null, image_path: imagePath, image_file_name: input.image?.name ?? null, image_mime_type: input.image?.type ?? null, image_size_bytes: input.image?.size ?? null } });
  if (error) {
    let message = error.message;
    if ("context" in error && error.context instanceof Response) {
      try { const body = await error.context.clone().json() as { error?: string }; if (body.error) message = body.error; } catch { /* mantém mensagem do SDK */ }
    }
    throw new Error(message);
  }
}
