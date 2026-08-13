"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { BusinessShell } from "@/features/business/components/business-shell";
import { CallResponseForm } from "@/features/business/components/call-response-form";
import { useBusinessCalls } from "@/features/business/hooks/use-business-calls";
import { getCurrentBusinessId, respondToQuotation } from "@/services/business/business-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function BusinessCallDetailsPage() {
  const params = useParams<{ id: string }>();
  const calls = useBusinessCalls();
  const queryClient = useQueryClient();
  const [responding, setResponding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const call = calls.data?.find((item) => item.notification.id === params.id);
  const reject = useMutation({ mutationFn: async () => respondToQuotation({ notificationId: params.id, businessId: await getCurrentBusinessId(), action: "reject" }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["business-calls"] }); }, onError: (error: Error) => setErrorMessage(error.message) });
  if (calls.isLoading) return <BusinessShell><p>Carregando chamado...</p></BusinessShell>;
  if (!call) return <BusinessShell><p className="rounded-2xl bg-[#FFFFFF] p-8">Chamado não encontrado ou já não está disponível.</p></BusinessShell>;
  const closed = call.notification.status !== "pending" && call.notification.status !== "sent";
  return <BusinessShell><Link href="/empresa/chamados" className="inline-flex items-center rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-black text-orange-600 shadow-sm">← Voltar aos chamados</Link><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]"><section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,.07)] sm:p-8"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Detalhes do chamado</p><h1 className="mt-3 text-3xl font-black">{call.request.part_name ?? call.request.description}</h1><p className="mt-4 text-sm text-[#111827]/60">{[call.request.vehicle_brand, call.request.vehicle_model, call.request.vehicle_year, call.request.vehicle_engine].filter(Boolean).join(" · ") || "Veículo não informado"}</p><p className="mt-5 text-sm leading-6 text-[#111827]/65">{call.request.observation ?? "Sem observações."}</p>{call.images?.length ? <div className="mt-6"><p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-orange-500">Foto enviada pelo cliente</p><div className="grid gap-3 sm:grid-cols-2">{call.images.map((image: { url: string; fileName: string | null }) => <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"><img src={image.url} alt={image.fileName ?? "Foto enviada pelo cliente"} className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]" /></a>)}</div></div> : null}<div className="mt-8 grid min-h-40 place-items-center rounded-2xl bg-[#F3F4F6] text-sm font-semibold text-[#111827]/40">Mapa preparado para integração futura</div><div className="mt-4 rounded-2xl bg-[#F3F4F6] p-4 text-sm font-bold">{closed ? "Solicitação encerrada." : `Expira em ${call.notification.expires_at ? new Date(call.notification.expires_at).toLocaleTimeString("pt-BR") : "breve"}`}</div></section>{responding ? <CallResponseForm notificationId={params.id} businessId={call.notification.business_id} /> : <section className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,.07)] sm:p-8"><p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">Ação rápida</p><h2 className="mt-2 text-2xl font-black">Responder ao cliente</h2>{errorMessage ? <p className="mt-4 rounded-2xl bg-[#F97316]/10 p-4 text-sm text-[#9A3412]">{errorMessage}</p> : null}<div className="mt-6 grid gap-3"><button type="button" disabled={closed || reject.isPending} onClick={() => setResponding(true)} className="min-h-12 rounded-xl bg-[#F97316] px-5 text-sm font-black uppercase text-[#FFFFFF] disabled:opacity-50">Aceitar</button><button type="button" disabled={closed || reject.isPending} onClick={() => reject.mutate()} className="min-h-12 rounded-xl border border-[#111827]/10 px-5 text-sm font-black uppercase disabled:opacity-50">{reject.isPending ? "Recusando..." : "Recusar"}</button></div></section>}</div></BusinessShell>;
}
