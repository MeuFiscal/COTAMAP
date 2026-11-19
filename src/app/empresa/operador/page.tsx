"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
 getAvailableBusinesses,
 getBusinessEmployeesForBusiness,
 getEmployeePinConfigured,
 getSelectedBusinessId,
 setInitialEmployeePin,
 setSelectedBusinessId,
 verifyEmployeePin,
} from "@/services/business/business-service";
import { useOperator } from "@/features/business/context/operator-context";

type Employee = {
 id: string;
 business_id: string;
 profile_id: string;
 role: string;
 presence_status: string | null;
 full_name?: string | null;
 email?: string | null;
};

function employeeName(employee: Employee): string {
 return employee.full_name ?? employee.email ?? "Usuário";
}

function employeeInitials(employee: Employee): string {
 const name = employeeName(employee);
 return name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function roleLabel(role: string): string {
 if (role === "owner") return "Assinante";
 if (role === "manager") return "Gerente";
 return "Funcionário";
}

export default function OperatorPage() {
 const router = useRouter();
 const { setOperator, setBusiness, clearOperator, clearBusiness } = useOperator();
 const businesses = useQuery({ queryKey: ["available-businesses"], queryFn: getAvailableBusinesses });
 const persistedBusiness = useQuery({ queryKey: ["selected-business"], queryFn: getSelectedBusinessId });
 const [manualBusinessId, setManualBusinessId] = useState<string | null>(null);
 const [selected, setSelected] = useState<string | null>(null);
 const [pin, setPin] = useState("");
 const [confirmPin, setConfirmPin] = useState("");
 const [error, setError] = useState<string | null>(null);
 const [submitting, setSubmitting] = useState(false);

 const businessId = manualBusinessId ?? persistedBusiness.data ?? (businesses.data?.length === 1 ? businesses.data[0].id : null);
 const employees = useQuery({
 queryKey: ["business-employees", businessId],
 queryFn: () => getBusinessEmployeesForBusiness(businessId as string),
 enabled: Boolean(businessId),
 });
 const selectedEmployee = (employees.data as Employee[] | undefined)?.find((item) => item.id === selected) ?? null;
 const pinStatus = useQuery({ queryKey: ["employee-pin-status", selected], queryFn: () => getEmployeePinConfigured(selected as string), enabled: Boolean(selected) });
 const selectedBusiness = businesses.data?.find((business) => business.id === businessId);

 function selectBusiness(nextBusinessId: string) {
 setError(null);
 setSelected(null);
 setPin("");
 setConfirmPin("");
 setManualBusinessId(nextBusinessId);
 clearOperator();
 clearBusiness();
 void setSelectedBusinessId(nextBusinessId).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível selecionar a empresa."));
 }

 function setSelectedOperator(employee: Employee) {
 if (!selectedBusiness) return;
 setBusiness({ id: selectedBusiness.id, name: selectedBusiness.name, logoUrl: selectedBusiness.logo_url, isAvailableForRequests: Boolean(selectedBusiness.is_available_for_requests), availabilityUpdatedAt: selectedBusiness.availability_updated_at });
 setOperator({ id: employee.id, businessId: employee.business_id, profileId: employee.profile_id, role: employee.role, name: employeeName(employee), presenceStatus: employee.presence_status === "online" ? "online" : "offline" });
 router.push("/empresa/dashboard");
 }

 async function submit() {
 if (!selected || !/^[0-9]{4}([0-9]{2})?$/.test(pin)) { setError("Informe um PIN de 4 ou 6 dígitos."); return; }
 setSubmitting(true);
 try {
 const valid = await verifyEmployeePin(selected, pin);
 if (!valid) { setError("PIN inválido."); return; }
 const employee = (employees.data as Employee[] | undefined)?.find((item) => item.id === selected);
 if (employee) setSelectedOperator(employee);
 } catch (reason: unknown) {
 setError(reason instanceof Error ? reason.message : "Não foi possível validar o PIN.");
 } finally {
 setSubmitting(false);
 }
 }

 async function createPin() {
 if (!selected || !/^[0-9]{4}([0-9]{2})?$/.test(pin)) { setError("O PIN deve ter 4 ou 6 dígitos."); return; }
 if (pin !== confirmPin) { setError("A confirmação do PIN não confere."); return; }
 setSubmitting(true);
 try {
 const created = await setInitialEmployeePin(selected, pin);
 if (!created) { setError("Não foi possível criar este PIN. Tente novamente."); return; }
 if (selectedEmployee) setSelectedOperator(selectedEmployee);
 } catch (reason: unknown) {
 setError(reason instanceof Error ? reason.message : "Não foi possível criar este PIN.");
 } finally {
 setSubmitting(false);
 }
 }

 const needsPin = pinStatus.data === false;

 // ─── Tela de PIN ───
 if (selected && selectedEmployee) {
 return (
 <main className="flex min-h-[100dvh] flex-col bg-[#171717]">
 {/* Header */}
 <header className="border-b border-white/10 bg-[#171717]/95 px-4 py-4 backdrop-blur-xl sm:px-6">
 <div className="mx-auto flex max-w-lg items-center gap-3">
 <button type="button" onClick={() => { setSelected(null); setPin(""); setConfirmPin(""); setError(null); }} className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:border-[#F97316] hover:text-[#F97316]"><ArrowLeft className="size-5" /></button>
 <div className="inline-flex items-center gap-2 font-black tracking-[-0.04em] text-white">
 <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-white">📍</span>
 <span className="text-xl">Cota<span className="text-[#F97316]">Map</span></span>
 </div>
 </div>
 </header>

 {/* Conteúdo */}
 <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
 <div className="w-full max-w-md space-y-6">
 {/* Avatar e nome do operador */}
 <div className="text-center">
 <div className="mx-auto grid size-20 place-items-center rounded-full border-2 border-orange-400/50 bg-orange-500 text-2xl font-black text-white shadow-[0_12px_30px_rgba(249,115,22,.3)]">
 {employeeInitials(selectedEmployee)}
 </div>
 <h1 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{employeeName(selectedEmployee)}</h1>
 <p className="mt-1 text-sm font-semibold text-white/60">{roleLabel(selectedEmployee.role)} · {selectedBusiness?.name}</p>
 </div>

 {/* Formulário de PIN */}
 <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-[0_18px_45px_rgba(0,0,0,.3)] backdrop-blur-sm sm:p-8">
 {pinStatus.isLoading ? (
 <div className="flex items-center justify-center gap-3 py-8">
 <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-[#F97316]" />
 <p className="text-sm font-semibold text-white/60">Verificando configuração do PIN...</p>
 </div>
 ) : needsPin && selectedEmployee.role === "owner" ? (
 <>
 <div className="mb-6 text-center">
 <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-orange-500/20 text-[#F97316]"><ShieldCheck className="size-6" /></div>
 <h2 className="text-xl font-black text-white">Crie seu PIN</h2>
 <p className="mt-1 text-sm text-white/60">Crie um PIN para começar a usar a empresa.</p>
 </div>
 <div className="space-y-4">
 <div>
 <label htmlFor="new-operator-pin" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">Novo PIN</label>
 <input id="new-operator-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-center text-lg font-black tracking-[0.3em] text-white placeholder:text-white/25 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30" placeholder="••••" autoComplete="off" />
 </div>
 <div>
 <label htmlFor="confirm-operator-pin" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">Confirmar PIN</label>
 <input id="confirm-operator-pin" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-center text-lg font-black tracking-[0.3em] text-white placeholder:text-white/25 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30" placeholder="••••" autoComplete="off" />
 </div>
 <button type="button" disabled={submitting} onClick={() => void createPin()} className="w-full rounded-xl bg-[#F97316] px-4 py-3.5 font-black text-white shadow-[0_12px_28px_rgba(249,115,22,.35)] transition hover:-translate-y-0.5 hover:bg-[#EA6800] disabled:opacity-50 disabled:shadow-none">
 {submitting ? <span className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Criando...</span> : "Criar PIN e entrar"}
 </button>
 </div>
 </>
 ) : needsPin ? (
 <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-5 text-center">
 <LockKeyhole className="mx-auto mb-3 size-8 text-amber-400" />
 <p className="font-bold text-amber-200">PIN não configurado</p>
 <p className="mt-1 text-sm text-amber-300/70">Este usuário ainda não possui PIN. Peça ao responsável da empresa para configurar.</p>
 </div>
 ) : (
 <>
 <div className="mb-6 text-center">
 <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-orange-500/20 text-[#F97316]"><LockKeyhole className="size-6" /></div>
 <h2 className="text-xl font-black text-white">PIN do usuário</h2>
 <p className="mt-1 text-sm text-white/60">Informe seu PIN para acessar o painel.</p>
 </div>
 <div className="space-y-4">
 <div>
 <label htmlFor="operator-pin" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/50">PIN</label>
 <input id="operator-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-center text-lg font-black tracking-[0.3em] text-white placeholder:text-white/25 focus:border-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]/30" placeholder="••••" autoComplete="off" autoFocus />
 </div>
 <button type="button" disabled={submitting} onClick={() => void submit()} className="w-full rounded-xl bg-[#F97316] px-4 py-3.5 font-black text-white shadow-[0_12px_28px_rgba(249,115,22,.35)] transition hover:-translate-y-0.5 hover:bg-[#EA6800] disabled:opacity-50 disabled:shadow-none">
 {submitting ? <span className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Entrando...</span> : "Entrar"}
 </button>
 </div>
 </>
 )}

 {error ? (
 <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-semibold text-red-300" role="alert">{error}</div>
 ) : null}
 </div>
 </div>
 </div>
 </main>
 );
 }

 // ─── Tela de Seleção ───
 return (
 <main className="min-h-[100dvh] bg-[#F3F4F6]">
 {/* Hero Premium */}
 <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
 <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
 <div className="relative mx-auto max-w-[1440px]">
 <div className="inline-flex items-center gap-2 font-black tracking-[-0.04em]">
 <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-white">📍</span>
 <span className="text-xl">Cota<span className="text-[#F97316]">Map</span></span>
 </div>
 <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-orange-300">CotaMap Empresa</p>
 <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Bem-vindo ao CotaMap Empresa</h1>
 <p className="mt-3 text-base text-white/75 sm:text-lg">Selecione seu perfil para acessar o painel.</p>
 </div>
 </section>

 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 {/* Seleção de Empresa (múltiplas) */}
 {businesses.isLoading ? (
 <div className="-mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Carregando empresas">
 {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[1.5rem] bg-white/70" />)}
 </div>
 ) : businesses.data && businesses.data.length > 1 ? (
 <div className="-mt-8">
 <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Empresas disponíveis</p>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Empresas disponíveis">
 {businesses.data.map((business) => (
 <button key={business.id} type="button" onClick={() => selectBusiness(business.id)} className={`group relative rounded-[1.5rem] border p-5 text-left transition duration-200 hover:-translate-y-0.5 ${business.id === businessId ? "border-[#F97316] bg-orange-50 shadow-[0_12px_30px_rgba(249,115,22,.15)]" : "border-white bg-white shadow-[0_12px_30px_rgba(15,23,42,.08)] hover:border-orange-200"}`}>
 <span className="font-black text-slate-950 group-hover:text-[#F97316]">{business.name}</span>
 <span className="mt-1 block text-sm text-slate-500">Selecionar empresa</span>
 </button>
 ))}
 </div>
 </div>
 ) : businesses.data?.length === 0 ? (
 <div className="-mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">🏢</div>
 <p className="mt-4 text-xl font-black text-slate-950">Nenhuma empresa ativa disponível.</p>
 </div>
 ) : null}

 {/* Listagem de Operadores */}
 {businessId ? (
 <div className="mt-8">
 <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Operadores disponíveis</p>
 {employees.isLoading ? (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Carregando usuários">
 {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-[1.5rem] bg-white/70" />)}
 </div>
 ) : employees.data?.length === 0 ? (
 <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
 <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">👤</div>
 <p className="mt-4 text-xl font-black text-slate-950">Nenhum usuário ativo disponível.</p>
 </div>
 ) : (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {(employees.data as Employee[] | undefined)?.map((employee) => {
 const isSelected = selected === employee.id;
 const isOnline = employee.presence_status === "online";
 return (
 <button key={employee.id} type="button" onClick={() => { setSelected(employee.id); setPin(""); setConfirmPin(""); setError(null); }} className={`group relative flex items-center gap-4 rounded-[1.5rem] border p-5 text-left transition duration-200 hover:-translate-y-0.5 ${isSelected ? "border-[#F97316] bg-orange-50 shadow-[0_12px_30px_rgba(249,115,22,.15)]" : "border-white bg-white shadow-[0_12px_30px_rgba(15,23,42,.08)] hover:border-orange-200"}`}>
 {/* Avatar */}
 <div className={`grid size-12 shrink-0 place-items-center rounded-full text-sm font-black ${isSelected ? "bg-[#F97316] text-white" : "bg-slate-100 text-slate-600 group-hover:bg-orange-100 group-hover:text-[#F97316]"}`}>
 {employeeInitials(employee)}
 </div>
 {/* Info */}
 <div className="min-w-0 flex-1">
 <p className={`truncate font-black ${isSelected ? "text-[#F97316]" : "text-slate-950 group-hover:text-[#F97316]"}`}>{employeeName(employee)}</p>
 <div className="mt-1 flex items-center gap-2 text-xs font-semibold">
 <span className="text-slate-500">{roleLabel(employee.role)}</span>
 <span className="text-slate-300">·</span>
 <span className={`inline-flex items-center gap-1 ${isOnline ? "text-emerald-600" : "text-slate-400"}`}>
 {isOnline ? <CheckCircle2 className="size-3" /> : <Circle className="size-3" />}
 {isOnline ? "Online" : "Offline"}
 </span>
 </div>
 </div>
 {/* Indicador de seleção */}
 {isSelected && <div className="grid size-6 place-items-center rounded-full bg-[#F97316] text-white"><CheckCircle2 className="size-3.5" /></div>}
 </button>
 );
 })}
 </div>
 )}
 </div>
 ) : null}
 </div>
 </main>
 );
}
