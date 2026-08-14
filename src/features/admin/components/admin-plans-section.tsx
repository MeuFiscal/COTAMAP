"use client";

import { Edit3, MoreHorizontal, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getCaktoCatalog } from "@/services/admin/admin-service";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  promotional_price: number | null;
  daily_quote_limit: number | null;
  is_unlimited: boolean;
  benefits: string[] | null;
  provider: string | null;
  provider_product_id: string | null;
  provider_offer_id: string | null;
  provider_checkout_id: string | null;
  provider_checkout_url: string | null;
  is_public: boolean;
  is_default_free: boolean;
  sort_order: number;
  is_active: boolean;
};

type Props = { plans: Plan[]; update: { mutate: (body: Record<string, unknown>) => void; isPending: boolean } };

const money = (value: number | null) => value === 0 ? "Grátis" : `R$ ${Number(value ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`;
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10";
const labelClass = "text-xs font-bold text-slate-600";
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "plano";

function StatusBadge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "orange" }) {
  const tones = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-50 text-emerald-700", orange: "bg-orange-50 text-orange-700" };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function PlanEditor({ plan, onClose, update }: { plan?: Plan; onClose: () => void; update: Props["update"] }) {
  const [unlimited, setUnlimited] = useState(plan?.is_unlimited ?? false);
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number | null; type: string; status: string }>>([]);
  const [offers, setOffers] = useState<Array<{ id: string; name: string; price: number | null; type: string; recurrence_period: number | null; default: boolean }>>([]);
  const [productId, setProductId] = useState(plan?.provider_product_id ?? "");
  const [offerId, setOfferId] = useState(plan?.provider_offer_id ?? "");
  const [planName, setPlanName] = useState(plan?.name ?? "");
  const [planPrice, setPlanPrice] = useState<number | "">(plan?.price ?? "");
  const [planCode, setPlanCode] = useState(plan?.code ?? slugify(plan?.name ?? ""));
  const [catalogLoading, setCatalogLoading] = useState(false);
  const refreshProducts = async () => { setCatalogLoading(true); try { const result = await getCaktoCatalog("products"); setProducts((result.products ?? []).map(({ id, name, price, type, status }) => ({ id, name, price, type, status }))); } finally { setCatalogLoading(false); } };
  const loadOffers = async (id: string) => { setProductId(id); setOfferId(""); if (!id) { setOffers([]); return; } setCatalogLoading(true); try { const result = await getCaktoCatalog("offers", id); setOffers((result.offers ?? []).map(({ id: offerId, name, price, type, recurrence_period, default: isDefault }) => ({ id: offerId, name, price, type, recurrence_period, default: isDefault }))); } finally { setCatalogLoading(false); } };
  useEffect(() => { if (plan?.provider_product_id) void (async () => { try { const result = await getCaktoCatalog("products"); setProducts((result.products ?? []).map(({ id, name, price, type, status }) => ({ id, name, price, type, status }))); } catch { /* catálogo opcional: os IDs existentes permanecem intactos */ } })(); }, [plan?.provider_product_id]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {
      operation: plan ? "update_plan" : "create_plan",
      ...(plan ? { plan_id: plan.id } : {}),
      code: planCode, name: planName, description: String(f.get("description") ?? ""),
      price: Number(planPrice), promotional_price: f.get("promotional_price") ? Number(f.get("promotional_price")) : null,
      daily_limit: unlimited ? null : Number(f.get("daily_limit")), is_unlimited: unlimited,
      benefits: String(f.get("benefits") ?? "").split("\n").map(v => v.trim()).filter(Boolean),
      provider: productId ? "cakto" : String(f.get("provider") ?? "") || null, provider_product_id: productId || String(f.get("provider_product_id") ?? "") || null,
      provider_offer_id: offerId || String(f.get("provider_offer_id") ?? "") || null, provider_checkout_id: String(f.get("provider_checkout_id") ?? "") || null,
      provider_checkout_url: String(f.get("provider_checkout_url") ?? "") || null, is_public: f.get("is_public") === "on",
      is_active: f.get("is_active") === "on", sort_order: plan?.sort_order ?? 0,
    };
    update.mutate(body);
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={plan ? `Editar ${plan.name}` : "Novo plano"}>
    <div className="h-full w-full max-w-xl overflow-y-auto bg-[#f8fafc] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur sm:px-8"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-orange-500">{plan ? "Editar plano" : "Novo plano"}</p><h2 className="mt-1 text-2xl font-black text-slate-950">{plan?.name ?? "Criar plano"}</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X className="size-5"/></button></div>
      <form onSubmit={submit} className="space-y-7 px-6 py-7 sm:px-8">
        <section><h3 className="text-sm font-black text-slate-950">Integração Cakto</h3><div className="mt-3 grid gap-3 rounded-2xl border border-orange-100 bg-orange-50/40 p-4"><div className="flex items-end gap-3"><label className={labelClass + " flex-1"}>Produto Cakto<select value={productId} onChange={e => void loadOffers(e.target.value)} className={inputClass}><option value="">Selecione um produto</option>{products.map(product => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><button type="button" onClick={() => void refreshProducts()} disabled={catalogLoading} className="rounded-xl border border-orange-200 bg-white px-3 py-3 text-xs font-bold text-orange-700">{catalogLoading ? "Atualizando..." : "Atualizar da Cakto"}</button></div><label className={labelClass}>Oferta<select value={offerId} onChange={e => { const selected = offers.find(offer => offer.id === e.target.value); setOfferId(e.target.value); if (selected) { setPlanName(selected.name); setPlanPrice(selected.price ?? ""); setPlanCode(slugify(selected.name)); } }} disabled={!productId || catalogLoading} className={inputClass}><option value="">Selecione uma oferta</option>{offers.map(offer => <option key={offer.id} value={offer.id}>{offer.name} - {offer.price == null ? "Preço não informado" : "R$ " + offer.price.toFixed(2).replace(".", ",")} - {offer.recurrence_period === 30 ? "mês" : offer.recurrence_period ? "a cada " + offer.recurrence_period + " dias" : offer.type || "Oferta"}</option>)}</select></label></div></section>
        <section><h3 className="text-sm font-black text-slate-950">Informações do plano</h3><div className="mt-4 grid gap-4"><label className={labelClass}>Nome<input name="name" value={planName} onChange={e => { setPlanName(e.target.value); if (!plan && !offerId) setPlanCode(slugify(e.target.value)); }} required className={inputClass}/></label><label className={labelClass}>Descrição<textarea name="description" defaultValue={plan?.description} rows={2} className={inputClass}/></label></div></section>
        <section><h3 className="text-sm font-black text-slate-950">Preço</h3><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className={labelClass}>Preço mensal<input name="price" value={planPrice} onChange={e => setPlanPrice(e.target.value === "" ? "" : Number(e.target.value))} required type="number" min="0" step="0.01" className={inputClass}/></label><label className={labelClass}>Preço promocional <span className="font-normal text-slate-400">(opcional)</span><input name="promotional_price" defaultValue={plan?.promotional_price ?? ""} type="number" min="0" step="0.01" className={inputClass}/></label></div></section>
        <section><h3 className="text-sm font-black text-slate-950">Uso</h3><div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4"><label className={labelClass}>Limite de chamados por dia<input name="daily_limit" defaultValue={plan?.daily_quote_limit ?? ""} type="number" min="0" disabled={unlimited} className={`${inputClass} ${unlimited ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}/></label><label className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700"><input name="is_unlimited" type="checkbox" checked={unlimited} onChange={e => setUnlimited(e.target.checked)} className="size-4 accent-orange-500"/> Chamados ilimitados</label></div></section>
        <section><h3 className="text-sm font-black text-slate-950">Benefícios</h3><label className={`${labelClass} mt-4 block`}>Vantagens<textarea name="benefits" defaultValue={(plan?.benefits ?? []).join("\n")} rows={5} className={inputClass}/><span className="mt-2 block text-xs font-normal text-slate-400">Cada linha será exibida como uma vantagem do plano.</span></label></section>
        <section><h3 className="text-sm font-black text-slate-950">Visibilidade</h3><div className="mt-4 flex flex-wrap gap-5"><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input name="is_active" type="checkbox" defaultChecked={plan?.is_active ?? true} className="size-4 accent-orange-500"/> Plano ativo</label><label className="flex items-center gap-2 text-sm font-bold text-slate-700"><input name="is_public" type="checkbox" defaultChecked={plan?.is_public ?? true} className="size-4 accent-orange-500"/> Mostrar na página pública</label></div></section>
        <section><h3 className="text-sm font-black text-slate-950">Checkout</h3><label className={`${labelClass} mt-4 block`}>URL do checkout<input name="provider_checkout_url" defaultValue={plan?.provider_checkout_url ?? ""} className={inputClass}/><span className="mt-1 block text-[11px] font-normal text-slate-400">Copie o link na aba Links do produto na Cakto.</span></label></section>
        <div className="sticky bottom-0 -mx-6 flex gap-3 border-t border-slate-200 bg-[#f8fafc]/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">Cancelar</button><button disabled={update.isPending} className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600">{update.isPending ? "Salvando..." : plan ? "Salvar alterações" : "Criar plano"}</button></div>
      </form>
    </div>
  </div>;
}

export function AdminPlansSection({ plans, update }: Props) {
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const act = (body: Record<string, unknown>, message: string) => { if (body.operation === "activate_plan" || body.operation === "deactivate_plan") { const target = plans.find(plan => plan.id === body.plan_id); if (target) setEditing(target); return; } if (window.confirm(message)) update.mutate(body); };
  return <section className="space-y-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Admin / SaaS</p><h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Planos</h1><p className="mt-2 text-sm text-slate-500">Gerencie os planos, preços e limites oferecidos aos lojistas.</p></div><button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600"><Plus className="size-4"/> Novo plano</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map(plan => { const hasPromo = plan.promotional_price !== null && plan.promotional_price < plan.price; const limit = plan.is_unlimited ? "Chamados ilimitados" : `Até ${plan.daily_quote_limit ?? 0} chamados por dia`; return <article key={plan.id} className="flex min-h-[245px] flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.05)] transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black text-slate-950">{plan.name}</h2><p className="mt-1 text-xs font-medium text-slate-400">{plan.description || "Plano CotaMap"}</p></div><StatusBadge tone={plan.is_active ? "green" : "slate"}>{plan.is_active ? "Ativo" : "Inativo"}</StatusBadge></div><div className="mt-5">{hasPromo && <p className="text-xs text-slate-400 line-through">{money(plan.price)}</p>}<p className="text-2xl font-black tracking-tight text-slate-950">{money(hasPromo ? plan.promotional_price : plan.price)}</p></div><p className="mt-2 text-sm font-semibold text-slate-600">{limit}</p><div className="mt-4 flex flex-wrap gap-2"><StatusBadge>{plan.is_public ? "Público" : "Privado"}</StatusBadge>{plan.is_default_free && <StatusBadge tone="orange">Plano padrão</StatusBadge>}{(plan.benefits ?? []).length > 0 && <StatusBadge>{plan.benefits?.length} vantagens</StatusBadge>}</div><div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><button onClick={() => setEditing(plan)} className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700"><Edit3 className="size-4"/> Editar plano</button><button onClick={() => act({ operation: plan.is_active ? "deactivate_plan" : "activate_plan", plan_id: plan.id }, `${plan.is_active ? "Desativar" : "Ativar"} este plano?`)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Ações secundárias"><MoreHorizontal className="size-5"/></button></div></article>; })}</div>{editing && <PlanEditor plan={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} update={update}/>}</section>;
}
