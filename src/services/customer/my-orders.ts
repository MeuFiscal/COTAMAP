import { createClient } from "@/lib/supabase/client";

export async function getMyOrders(orderId?: string, expectedUserId?: string) {
  const supabase = createClient();
  const { data: identity, error: authError } = await supabase.auth.getUser();
  if (authError || !identity.user) throw new Error("Sessão expirada.");
  if (expectedUserId && identity.user.id !== expectedUserId) throw new Error("Sessão alterada.");

  const requests = await supabase.from("quote_requests").select("id").eq("customer_id", identity.user.id).is("deleted_at", null);
  if (requests.error) throw requests.error;
  if (!requests.data.length) return [];
  const quotations = await supabase.from("quotations").select("*").in("quote_request_id", requests.data.map((request) => request.id));
  if (quotations.error) throw quotations.error;
  if (!quotations.data.length) return [];
  let ordersQuery = supabase.from("orders").select("id,quotation_id,status,created_at,updated_at").in("quotation_id", quotations.data.map((quotation) => quotation.id)).order("created_at", { ascending: false });
  if (orderId) ordersQuery = ordersQuery.eq("id", orderId);
  const orders = await ordersQuery;
  if (orders.error) throw orders.error;
  if (!orders.data.length) return [];
  const businesses = await supabase.from("businesses").select("*").in("id", [...new Set(quotations.data.map((quotation) => quotation.business_id))]);
  if (businesses.error) throw businesses.error;
  const items = await supabase.from("order_items").select("*").in("order_id", orders.data.map((order) => order.id));
  if (items.error) throw items.error;
  return orders.data.map((order) => {
    const quotation = quotations.data.find((item) => item.id === order.quotation_id);
    return { ...order, quotation: quotation ? { ...quotation, business: businesses.data.find((business) => business.id === quotation.business_id) ?? null } : null, items: items.data.filter((item) => item.order_id === order.id) };
  });
}

export async function getMyOrderById(orderId: string, expectedUserId?: string) {
  return (await getMyOrders(orderId, expectedUserId))[0] ?? null;
}
