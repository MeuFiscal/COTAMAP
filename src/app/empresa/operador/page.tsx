"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBusinessEmployees, verifyEmployeePin } from "@/services/business/business-service";
import { useOperator } from "@/features/business/context/operator-context";

export default function OperatorPage() {
  const router = useRouter();
  const { setOperator } = useOperator();
  const employees = useQuery({ queryKey: ["business-employees"], queryFn: getBusinessEmployees });
  const [selected, setSelected] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  async function submit() {
    if (!selected || !/^[0-9]{4}([0-9]{2})?$/.test(pin)) { setError("Informe um PIN de 4 ou 6 dígitos."); return; }
    const valid = await verifyEmployeePin(selected, pin);
    if (!valid) { setError("PIN inválido ou operador sem PIN configurado."); return; }
    const employee = employees.data?.find((item) => item.id === selected);
    if (!employee) return;
    setOperator({ id: employee.id, profileId: employee.profile_id, role: employee.role, name: employee.full_name ?? employee.email ?? "Operador", presenceStatus: employee.presence_status === "online" ? "online" : "offline" });
    router.push("/empresa/dashboard");
  }
  return <section className="mx-auto max-w-2xl space-y-6"><div><p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F97316]">CotaMap Empresa</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Escolha o usuário</h1><p className="text-black/60">Selecione seu nome e informe o PIN para iniciar.</p></div><div className="grid gap-3">{employees.data?.map((employee) => <button key={employee.id} type="button" onClick={() => { setSelected(employee.id); setError(null); }} className={`rounded-2xl border p-4 text-left ${selected === employee.id ? "border-[#F97316] bg-orange-50" : "border-black/10 bg-white"}`}><span className="font-bold">{employee.full_name ?? employee.email ?? "Usuário"}</span><span className="mt-1 block text-sm text-black/60">{employee.role === "owner" ? "Assinante" : employee.role === "manager" ? "Gerente" : "Funcionário"} · {employee.presence_status === "online" ? "Online" : "Offline"}</span></button>)}</div>{employees.isLoading ? <p>Carregando usuários...</p> : null}{employees.data?.length === 0 ? <p>Nenhum usuário ativo disponível.</p> : null}{selected ? <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm"><label htmlFor="operator-pin" className="block text-sm font-bold">PIN do usuário</label><input id="operator-pin" inputMode="numeric" maxLength={6} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} className="w-full rounded-xl border p-3" placeholder="4 ou 6 dígitos"/><button type="button" onClick={() => void submit()} className="w-full rounded-xl bg-[#F97316] px-4 py-3 font-bold text-white">Entrar</button>{error ? <p className="text-sm text-red-600">{error}</p> : null}</div> : null}</section>;
}
