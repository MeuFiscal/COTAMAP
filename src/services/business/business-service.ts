import { createClient } from "@/lib/supabase/client";
import { invokeEnsureBusinessAccount } from "@/services/auth/auth-service";
import type { QuoteNotificationRow, QuoteRequestRow } from "@/types/database";

export async function getBusinessEmployees() {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data, error } = await supabase.from("business_employees").select("id, profile_id, role, is_active, presence_status, profiles(full_name,email)").eq("business_id", businessId).eq("is_active", true).is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, full_name: Array.isArray(row.profiles) ? row.profiles[0]?.full_name : row.profiles?.full_name, email: Array.isArray(row.profiles) ? row.profiles[0]?.email : row.profiles?.email }));
}

export async function verifyEmployeePin(employeeId: string, pin: string): Promise<boolean> { const supabase = createClient(); const { data, error } = await supabase.rpc("verify_employee_pin", { target_employee_id: employeeId, submitted_pin: pin }); if (error) throw error; return Boolean(data); }

export async function getCurrentBusinessId(): Promise<string> {
  const supabase = createClient();
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error("Sessão expirada.");
  const { data, error } = await supabase.from("business_employees").select("business_id").eq("profile_id", session.session.user.id).eq("is_active", true).limit(1).maybeSingle();
  if (error || !data) { const bootstrap = await invokeEnsureBusinessAccount(supabase); if (!bootstrap.error && bootstrap.data?.business_id) return String(bootstrap.data.business_id); throw bootstrap.error ?? new Error(error?.message ?? "Usuário não vinculado a uma autopeça."); }
  return data.business_id;
}
