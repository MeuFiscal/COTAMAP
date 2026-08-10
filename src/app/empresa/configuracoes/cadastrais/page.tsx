"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BusinessShell } from "@/features/business/components/business-shell";
import { getBusinessRegistration, updateBusinessRegistration, type BusinessRegistrationInput } from "@/services/business/registration-service";

const empty: BusinessRegistrationInput = { name: "", phone: "", whatsapp: "", addressLine: "", addressNumber: "", neighborhood: "", postalCode: "", city: "", state: "" };

export default function BusinessRegistrationPage() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["business-registration"], queryFn: getBusinessRegistration });
  const [form, setForm] = useState<BusinessRegistrationInput | null>(null);
  const currentForm: BusinessRegistrationInput = form ?? (query.data ? { name: query.data.name, phone: query.data.phone ?? "", whatsapp: query.data.whatsapp ?? "", addressLine: query.data.addressLine ?? "", addressNumber: query.data.addressNumber ?? "", neighborhood: query.data.neighborhood ?? "", postalCode: query.data.postalCode ?? "", city: query.data.city ?? "", state: query.data.state ?? "" } : empty);
  const mutation = useMutation({ mutationFn: updateBusinessRegistration, onSuccess: async () => { await client.invalidateQueries({ queryKey: ["business-registration"] }); } });
  const set = (key: keyof BusinessRegistrationInput, value: string) => setForm((current) => ({ ...(current ?? currentForm), [key]: value }));
  return <BusinessShell><section className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Empresa</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Dados cadastrais</h1><p className="mt-3 text-black/55">Mantenha os dados públicos da sua loja atualizados.</p>{query.isLoading ? <p className="mt-8">Carregando dados...</p> : query.error ? <p role="alert" className="mt-8 rounded-2xl bg-orange-50 p-5 text-sm text-orange-900">Não foi possível carregar os dados cadastrais.</p> : <form onSubmit={(event) => { event.preventDefault(); mutation.mutate(currentForm); }} className="mt-8 grid gap-5 rounded-3xl bg-white p-6 shadow-sm sm:grid-cols-2 sm:p-8">{([ ["name", "Nome da empresa"], ["phone", "Telefone"], ["whatsapp", "WhatsApp"], ["addressLine", "Rua"], ["addressNumber", "Número"], ["neighborhood", "Bairro"], ["postalCode", "CEP"], ["city", "Cidade"], ["state", "Estado (UF)"] ] as const).map(([key, label]) => <label key={key} className="text-sm font-black">{label}<input value={currentForm[key]} onChange={(event) => set(key, event.target.value)} required={key === "name"} className="mt-2 w-full rounded-xl border border-[#111827]/15 p-3 font-normal focus:border-[#F97316] focus:outline-none" /></label>)}{mutation.error ? <p role="alert" className="sm:col-span-2 text-sm text-red-700">{mutation.error.message}</p> : null}{mutation.isSuccess ? <p role="status" className="sm:col-span-2 text-sm text-emerald-700">Dados cadastrais salvos.</p> : null}<button type="submit" disabled={mutation.isPending} className="sm:col-span-2 rounded-xl bg-[#F97316] px-5 py-4 font-black text-white">{mutation.isPending ? "Salvando..." : "Salvar dados cadastrais"}</button></form>}</section></BusinessShell>;
}
