"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { createClient } from "@/lib/supabase/client";
import { adminCore, getAdminOverview, getAdminSaas } from "@/services/admin/admin-service";

type Tab = "dashboard" | "saas" | "checkouts";

export default function AdminPage() {
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: getAdminOverview });
  const saas = useQuery({ queryKey: ["admin-saas"], queryFn: getAdminSaas });
  const queryClient = useQueryClient();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [limits, setLimits] = useState<Record<string, string>>({});

  useEffect(() => {
    void createClient().from("platform_admins").select("active").eq("active", true).maybeSingle().then(({ data }) => setAllowed(data?.active === true));
  }, []);

  const update = useMutation({
    mutationFn: adminCore,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-saas"] }),
  });

  if (allowed === false) return <PrivateShell><p className="rounded-2xl bg-white p-8 text-center">Acesso negado.</p></PrivateShell>;
  if (allowed === null || overview.isLoading || saas.isLoading) return <PrivateShell><p>Carregando painel administrativo...</p></PrivateShell>;
  if (overview.error || saas.error || !overview.data || !saas.data) return <PrivateShell><p role="alert" className="text-red-600">Não foi possível carregar o painel.</p></PrivateShell>;

  const data = overview.data;
  const cards: Array<[string, number]> = [
    ["Empresas ativas", data.businesses.filter((business) => business.status === "active").length],
    ["Empresas Premium", data.premiumBusinessIds.size],
    ["Empresas Free", Math.max(0, data.businesses.length - data.premiumBusinessIds.size)],
    ["Clientes", data.profiles.filter((profile) => profile.role === "customer").length],
    ["Funcionários", data.employees.length],
    ["Solicitações", data.requests.length],
    ["Cotações", data.quotations.length],
    ["Pedidos", data.orders.length],
    ["Pedidos concluídos", data.orders.filter((order) => order.status === "completed").length],
  ];

  return <PrivateShell>
    <nav className="mb-8 flex flex-wrap gap-2" aria-label="Menu administrativo">
      {([["dashboard", "Dashboard"], ["saas", "SaaS"], ["checkouts", "Checkouts"]] as Array<[Tab, string]>).map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-3 text-sm font-bold ${tab === value ? "bg-[#F97316] text-white" : "bg-white"}`}>{label}</button>)}
    </nav>
    {tab === "dashboard" && <><h1 className="text-4xl font-black">Dashboard da plataforma</h1><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <article key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-black/55">{label}</p><strong className="mt-2 block text-3xl">{value}</strong></article>)}</div></>}
    {tab === "saas" && <section className="space-y-4"><h1 className="text-4xl font-black">SaaS</h1>{saas.data.plans.map((plan) => { const limit = limits[plan.id] ?? String(plan.daily_quote_limit ?? ""); return <article key={plan.id} className="rounded-2xl bg-white p-6 shadow-sm"><h2 className="text-xl font-black">{plan.name}</h2><p className="mt-2 text-sm text-black/55">{plan.description}</p><p className="mt-3">Preço: R$ {Number(plan.price).toFixed(2)}</p><label className="mt-4 block text-sm font-semibold">Limite diário de chamados<input type="number" min="0" value={limit} disabled={plan.code === "premium"} onChange={(event) => setLimits((current) => ({ ...current, [plan.id]: event.target.value }))} className="mt-2 w-full rounded-xl border p-3" /></label>{plan.code === "free" && <button disabled={update.isPending} onClick={() => update.mutate({ operation: "update_plan", plan_id: plan.id, price: plan.price, daily_limit: Number(limit) })} className="mt-4 rounded-xl bg-[#F97316] px-4 py-3 text-sm font-bold text-white">Salvar limite</button>}</article>; })}</section>}
    {tab === "checkouts" && <section><h1 className="text-4xl font-black">Checkouts</h1><div className="mt-8 space-y-3">{saas.data.checkouts.length === 0 && <p>Nenhum checkout cadastrado.</p>}{saas.data.checkouts.map((checkout) => <article key={checkout.id} className="rounded-2xl bg-white p-5"><p className="font-black">{checkout.name}</p><p className="text-sm text-black/55">{checkout.url}</p><button disabled={update.isPending || checkout.is_active} onClick={() => update.mutate({ operation: "activate_checkout", checkout_id: checkout.id })} className="mt-3 rounded-xl border px-4 py-2 text-sm font-bold">{checkout.is_active ? "Checkout ativo" : "Ativar checkout"}</button></article>)}</div></section>}
  </PrivateShell>;
}
