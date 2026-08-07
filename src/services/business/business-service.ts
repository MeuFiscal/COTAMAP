import { createClient } from "@/lib/supabase/client";
import type { QuoteNotificationRow, QuoteRequestRow } from "@/types/database";

export async function getBusinessEmployees() {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data, error } = await supabase.from("business_employees").select("id, profile_id, role, is_active, presence_status").eq("business_id", businessId).eq("is_active", true).is("deleted_at", null);
  if (error) throw error;
  return data;
}

export async function verifyEmployeePin(employeeId: string, pin: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("verify_employee_pin", { target_employee_id: employeeId, submitted_pin: pin });
  if (error) throw error;
  return Boolean(data);
}

export async function getCurrentBusinessId(): Promise<string> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  const { data, error } = await supabase.from("business_employees").select("business_id").eq("profile_id", session.session.user.id).eq("is_active", true).limit(1).maybeSingle();
  if (error || !data) throw new Error("Usuário não vinculado a uma autopeça.");
  return data.business_id;
}

export async function getBusinessCalls(): Promise<Array<{ notification: QuoteNotificationRow; request: QuoteRequestRow }>> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data: notifications, error } = await supabase.from("quote_notifications").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  if (!notifications.length) return [];
  const requestIds = [...new Set(notifications.map((item) => item.quote_request_id))];
  const { data: requests, error: requestError } = await supabase.from("quote_requests").select("*").in("id", requestIds).limit(100);
  if (requestError) throw requestError;
  const byId = new Map(requests.map((request) => [request.id, request]));
  return notifications.flatMap((notification) => { const request = byId.get(notification.quote_request_id); return request ? [{ notification, request }] : []; });
}

export async function respondToQuotation(input: { notificationId: string; businessId: string; action: "accept" | "reject"; amount?: number; notes?: string; availability?: string; pickupMinutes?: number; image?: File | null }): Promise<void> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  let imagePath: string | null = null;
  if (input.image) {
    imagePath = `${input.businessId}/${input.notificationId}/${crypto.randomUUID()}-${input.image.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("quotation-images").upload(imagePath, input.image, { contentType: input.image.type, upsert: false });
    if (error) throw new Error(`Não foi possível enviar a foto: ${error.message}`);
  }
  const { error } = await supabase.functions.invoke("respond-quotation", { body: { notification_id: input.notificationId, action: input.action, amount: input.amount, notes: [input.availability, input.notes].filter(Boolean).join(" · "), response_time_seconds: input.pickupMinutes ? input.pickupMinutes * 60 : null, image_path: imagePath, image_file_name: input.image?.name ?? null, image_mime_type: input.image?.type ?? null, image_size_bytes: input.image?.size ?? null } });
  if (error) throw new Error(error.message);
}
