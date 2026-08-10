"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelQuoteRequest } from "@/services/customer/customer-service";

export function CancelQuoteButton({ requestId }: { requestId: string }) {
  const client = useQueryClient();
  const mutation = useMutation({ mutationFn: () => cancelQuoteRequest(requestId), onSuccess: () => { void client.invalidateQueries({ queryKey: ["customer-quotations"] }); } });
  return <div className="mb-5 flex justify-end"><button type="button" disabled={mutation.isPending} onClick={() => { if (window.confirm("Cancelar esta solicitação de cotação?")) mutation.mutate(); }} className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 disabled:opacity-50">{mutation.isPending ? "Cancelando..." : "Cancelar cotação"}</button>{mutation.error ? <p role="alert" className="ml-3 self-center text-sm text-red-600">{mutation.error.message}</p> : null}</div>;
}
