"use client";

import { useQuery } from "@tanstack/react-query";
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
    try {
      const valid = await verifyEmployeePin(selected, pin);
      if (!valid) { setError("PIN inválido."); return; }
      const employee = (employees.data as Employee[] | undefined)?.find((item) => item.id === selected);
      if (employee) setSelectedOperator(employee);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível validar o PIN.");
    }
  }

  async function createPin() {
    if (!selected || !/^[0-9]{4}([0-9]{2})?$/.test(pin)) { setError("O PIN deve ter 4 ou 6 dígitos."); return; }
    if (pin !== confirmPin) { setError("A confirmação do PIN não confere."); return; }
    try {
      const created = await setInitialEmployeePin(selected, pin);
      if (!created) { setError("Não foi possível criar este PIN. Tente novamente."); return; }
      if (selectedEmployee) setSelectedOperator(selectedEmployee);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível criar este PIN.");
    }
  }

  const needsPin = pinStatus.data === false;
  return <section className="mx-auto max-w-2xl space-y-6">
    <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F97316]">CotaMap Empresa</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Escolha a empresa e o usuário</h1><p className="text-black/60">Selecione a empresa correta e informe o PIN para iniciar.</p></div>
    {businesses.isLoading ? <p>Carregando empresas...</p> : null}
    {businesses.data && businesses.data.length > 1 ? <div className="grid gap-3" aria-label="Empresas disponíveis">{businesses.data.map((business) => <button key={business.id} type="button" onClick={() => selectBusiness(business.id)} className={`rounded-2xl border p-4 text-left ${business.id === businessId ? "border-[#F97316] bg-orange-50" : "border-black/10 bg-white"}`}><span className="font-bold">{business.name}</span><span className="mt-1 block text-sm text-black/60">Selecionar empresa</span></button>)}</div> : null}
    {businesses.data?.length === 0 ? <p>Nenhuma empresa ativa disponível.</p> : null}
    {businessId ? <div className="grid gap-3">{(employees.data as Employee[] | undefined)?.map((employee) => <button key={employee.id} type="button" onClick={() => { setSelected(employee.id); setPin(""); setConfirmPin(""); setError(null); }} className={`rounded-2xl border p-4 text-left ${selected === employee.id ? "border-[#F97316] bg-orange-50" : "border-black/10 bg-white"}`}><span className="font-bold">{employeeName(employee)}</span><span className="mt-1 block text-sm text-black/60">{employee.role === "owner" ? "Assinante" : employee.role === "manager" ? "Gerente" : "Funcionário"} · {employee.presence_status === "online" ? "Online" : "Offline"}</span></button>)}</div> : null}
    {employees.isLoading && businessId ? <p>Carregando usuários...</p> : null}
    {businessId && employees.data?.length === 0 ? <p>Nenhum usuário ativo disponível.</p> : null}
    {selected ? <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">{pinStatus.isLoading ? <p className="text-sm text-black/60">Verificando configuração do PIN...</p> : needsPin && selectedEmployee?.role === "owner" ? <><h2 className="text-xl font-black">Crie seu PIN</h2><p className="text-sm text-black/60">Crie um PIN para começar a usar a empresa.</p><label htmlFor="new-operator-pin" className="block text-sm font-bold">Novo PIN</label><input id="new-operator-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border p-3" placeholder="4 ou 6 dígitos"/><label htmlFor="confirm-operator-pin" className="block text-sm font-bold">Confirmar PIN</label><input id="confirm-operator-pin" inputMode="numeric" maxLength={6} value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border p-3" placeholder="Repita o PIN"/><button type="button" onClick={() => void createPin()} className="w-full rounded-xl bg-[#F97316] px-4 py-3 font-bold text-white">Criar PIN e entrar</button></> : needsPin ? <p className="text-sm text-amber-700">Este usuário ainda não possui PIN. Peça ao responsável da empresa para configurar seu PIN.</p> : <><label htmlFor="operator-pin" className="block text-sm font-bold">PIN do usuário</label><input id="operator-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border p-3" placeholder="4 ou 6 dígitos"/><button type="button" onClick={() => void submit()} className="w-full rounded-xl bg-[#F97316] px-4 py-3 font-bold text-white">Entrar</button></>}{error ? <p className="text-sm text-red-600">{error}</p> : null}</div> : null}
  </section>;
}
