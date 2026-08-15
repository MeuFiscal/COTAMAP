"use client";

import Link from "next/link";

import { useQuoteSearch } from "@/features/quotes/hooks/use-quote-search";
import { SearchAnimation } from "@/features/quotes/components/search-animation";
import { SearchStatus } from "@/features/quotes/components/search-status";

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function SearchQuotesExperience({ requestId }: { requestId: string | null }) {
  const search = useQuoteSearch(requestId);
  if (!requestId) return <State title="Solicitação não encontrada" description="Crie uma nova solicitação para buscar empresas próximas." action="Nova cotação" href="/nova-cotacao" />;
  if (search.loading) return <State title="Carregando solicitação" description="Estamos recuperando o status da sua busca." />;
  if (search.error) return <State title="Não foi possível carregar" description="Verifique sua conexão e tente novamente." action="Tentar novamente" onClick={() => window.location.reload()} />;
  if (!search.request) return <State title="Solicitação não encontrada" description="Esta solicitação não está disponível para sua conta." />;
  if (search.empty && search.expired) return <State title="Nenhuma empresa encontrada na região" description="Não encontramos empresas ativas dentro do raio informado." action="Voltar e editar solicitação" href={`/nova-cotacao?request=${encodeURIComponent(search.request.id)}`} />;

  const notifications = search.notifications;
  const responded = notifications.filter((item) => item.status === "responded").length;
  const statusText = search.expired ? "Busca encerrada" : responded > 0 ? "Recebendo cotações" : "Buscando empresas disponíveis";
  const phase = search.expired ? "receiving" : responded > 0 ? "receiving" : notifications.length > 0 ? "waiting" : "locating";
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-6 shadow-sm sm:p-9">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Busca em tempo real</p><h1 className="mt-3 text-3xl font-black tracking-[-0.04em]">{statusText}</h1><p className="mt-2 text-sm text-[#111827]/55">{search.request.part_name ?? search.request.description}</p><div className="mt-6"><SearchStatus phase={phase} hasDispatch={notifications.length > 0} /></div></div>
          <SearchAnimation />
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <Metric label="Tempo restante" value={formatTime(search.remainingSeconds)} />
          <Metric label="Notificadas" value={String(notifications.length)} />
          <Metric label="Responderam" value={String(responded)} />
        </div>
      </section>
      <section className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-6 shadow-sm sm:p-9">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Atualização automática</p><h2 className="mt-2 text-2xl font-black">Empresas notificadas</h2></div>
          <span className="rounded-full bg-[#F3F4F6] px-3 py-1 text-xs font-bold">{responded} responderam</span>
        </div>
        {notifications.length === 0 ? <p className="mt-6 rounded-2xl border border-dashed border-[#111827]/15 p-6 text-center text-sm text-[#111827]/55">Procurando empresas disponíveis na sua região...</p> : <p className="mt-6 rounded-2xl bg-[#F3F4F6] p-5 text-center text-sm font-semibold text-[#111827]/60">{notifications.length} {notifications.length === 1 ? "empresa recebeu" : "empresas receberam"} sua solicitação. Aguardando respostas.</p>}
        {responded > 0 ? <Link href={`/cotacoes?request=${encodeURIComponent(search.request.id)}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F97316] px-5 text-sm font-black uppercase text-[#FFFFFF]">Ver cotações</Link> : null}
        <Link href={`/nova-cotacao?request=${encodeURIComponent(search.request.id)}`} className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-[#111827]/10 px-5 text-sm font-black uppercase text-[#111827]">Voltar e editar solicitação</Link>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#F3F4F6] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#111827]/45">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function State({ title, description, action, href, onClick }: { title: string; description: string; action?: string; href?: string; onClick?: () => void }) { return <section className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-8 text-center shadow-sm sm:p-12"><h1 className="text-2xl font-black">{title}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#111827]/55">{description}</p>{action && href ? <Link href={href} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F97316] px-6 text-sm font-black uppercase text-[#FFFFFF]">{action}</Link> : action && onClick ? <button type="button" onClick={onClick} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F97316] px-6 text-sm font-black uppercase text-[#FFFFFF]">{action}</button> : null}</section>; }
