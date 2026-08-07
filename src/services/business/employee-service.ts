import { createClient } from "@/lib/supabase/client";
import type { EmployeeEditInput, EmployeeInput } from "@/features/business/schemas/employee-schema";
import type { EmployeeRecord } from "@/features/business/types/employee";
import { getCurrentBusinessId } from "@/services/business/business-service";

async function invoke<T>(name: string, body: unknown): Promise<T> {
  const { data, error } = await createClient().functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) throw new Error(error.message);
  return data as T;
}

export async function getEmployees(): Promise<EmployeeRecord[]> {
  const supabase = createClient();
  const businessId = await getCurrentBusinessId();
  const { data, error } = await supabase.from("business_employees").select("id,business_id,profile_id,role,is_active,presence_status,last_access_at,last_activity_at").eq("business_id", businessId).is("deleted_at", null).order("created_at");
  if (error) throw error;
  const profileIds = data.map((row) => row.profile_id);
  const profiles = profileIds.length ? await supabase.from("profiles").select("id,full_name,email,phone").in("id", profileIds) : { data: [], error: null };
  const profileMap = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]));
  return data.map((row) => { const profile = profileMap.get(row.profile_id); const role = row.role === "owner" || row.role === "manager" || row.role === "employee" ? row.role : "employee"; return { id: row.id, businessId: row.business_id, profileId: row.profile_id, name: profile?.full_name ?? row.profile_id, email: profile?.email ?? null, phone: profile?.phone ?? null, role, isActive: row.is_active, presenceStatus: row.presence_status, lastAccessAt: row.last_access_at, lastActivityAt: row.last_activity_at }; });
}

export async function createEmployee(input: EmployeeInput): Promise<void> { await invoke("create-business-employee", { business_id: await getCurrentBusinessId(), email: input.email, full_name: input.fullName, phone: input.phone || null, role: input.role, pin: input.pin }); }
export async function updateEmployee(id: string, input: EmployeeEditInput): Promise<void> { await invoke("update-business-employee", { business_id: await getCurrentBusinessId(), employee_id: id, full_name: input.fullName, phone: input.phone || null, role: input.role, is_active: input.isActive }); }
export async function resetEmployeePin(id: string): Promise<string> { const result = await invoke<{ temporary_pin: string }>("reset-business-pin", { business_id: await getCurrentBusinessId(), employee_id: id }); return result.temporary_pin; }
export async function removeEmployee(id: string): Promise<void> { await invoke("remove-business-employee", { business_id: await getCurrentBusinessId(), employee_id: id }); }
