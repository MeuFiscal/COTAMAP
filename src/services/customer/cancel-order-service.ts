import { createClient } from "@/lib/supabase/client";

export async function cancelOrder(orderId: string): Promise<void> {
 const supabase = createClient();

 // A RPC cancelar_pedido_cliente existe no banco de produção mas não está
 // refletida nos tipos gerados localmente. Usamos rpc() com asserção de tipo
 // segura para chamar a função sem modificar o schema gerado.
 const { error } = await (supabase.rpc as unknown as (
 fn: "cancelar_pedido_cliente",
 args: { target_order_id: string },
 ) => Promise<{ data: unknown; error: { message: string } | null }>)("cancelar_pedido_cliente", {
 target_order_id: orderId,
 });

 if (error) {
 if (error.message.includes("not_order_owner")) {
 throw new Error("Você não tem permissão para cancelar este pedido.");
 }
 if (error.message.includes("invalid_order_transition")) {
 throw new Error("Este pedido não pode mais ser cancelado. Entre em contato com a loja.");
 }
 if (error.message.includes("order_not_found")) {
 throw new Error("Pedido não encontrado.");
 }
 if (error.message.includes("unauthenticated_user")) {
 throw new Error("Sessão expirada. Faça login novamente.");
 }
 throw new Error(error.message || "Não foi possível cancelar o pedido.");
 }
}
