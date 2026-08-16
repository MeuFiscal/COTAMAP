"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelQuoteRequest } from "@/services/customer/customer-service";
import { useCustomerRequestStatus } from "@/features/customer/hooks/use-customer-journey";

function friendlyCancelError(error: unknown) { const message = error instanceof Error ? error.message : ""; if (message.includes("request_not_cancellable")) return "Esta cotação não pode mais ser cancelada porque já avançou para a etapa de atendimento."; return "Não foi possível cancelar agora. Atualize a página e tente novamente."; }

export function CancelQuoteButton({ requestId }: { requestId: string }) {
  const client = useQueryClient();
  const status = useCustomerRequestStatus(requestId);
  const mutation = useMutation({ mutationFn: () => cancelQuoteRequest(requestId), onSuccess: () => { void client.invalidateQueries({ queryKey: ["customer-quotations"] }); void client.invalidateQueries({ queryKey: ["quote-request"] }); void client.invalidateQueries({ queryKey: ["business-calls"] }); } });
  if (status.isLoading) return null;
  if (status.data && status.data !== "waiting") return <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">{status.data === "cancelled" ? "Chamado cancelado" : "Este chamado não está mais aberto."}</p>;
  return <div className="mb-5 flex justify-end"><button type="button" disabled={mutation.isPending} onClick={() => { if (window.confirm("Cancelar esta solicitação de cotação?")) mutation.mutate(); }} className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-50">{mutation.isPending ? "Cancelando..." : "Cancelar cotação"}</button>{mutation.error ? <p role="alert" className="ml-3 self-center text-sm text-red-600">{friendlyCancelError(mutation.error)}</p> : null}</div>;
}
