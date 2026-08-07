import { createClient } from "@/lib/supabase/client";
export type AppNotification = { id: string; type: string; title: string; message: string; entityType: string | null; entityId: string | null; readAt: string | null; createdAt: string };
export async function getNotifications(): Promise<AppNotification[]> { const { data, error } = await createClient().from("notification_center").select("*").is("deleted_at", null).order("created_at", { ascending: false }); if (error) throw error; return data.map((item) => ({ id: item.id, type: item.type, title: item.title, message: item.message, entityType: item.entity_type, entityId: item.entity_id, readAt: item.read_at, createdAt: item.created_at })); }
export async function markNotificationRead(id: string) { const { error } = await createClient().rpc("mark_notification_read", { target_id: id }); if (error) throw error; }
export async function markAllNotificationsRead() { const { error } = await createClient().rpc("mark_all_notifications_read"); if (error) throw error; }
export async function deleteNotification(id: string) { const { error } = await createClient().rpc("delete_notification", { target_id: id }); if (error) throw error; }
