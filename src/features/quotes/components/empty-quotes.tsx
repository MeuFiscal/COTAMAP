import { Inbox, RotateCcw } from "lucide-react";
import Link from "next/link";

export function EmptyQuotes({ error = false }: { error?: boolean }) {
  return (
    <section className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
        <Inbox className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">
        {error ? "Não conseguimos carregar as cotações" : "Nenhuma cotação disponível"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#111827]/55">
        {error
          ? "A simulação encontrou um erro temporário. Tente abrir a lista novamente."
          : "As lojas ainda não enviaram propostas. Você pode voltar e iniciar uma nova busca."}
      </p>
      <Link
        href={error ? "/cotacoes" : "/nova-cotacao"}
        className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 text-sm font-black text-[#FFFFFF] transition hover:bg-[#111827]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        {error ? "Tentar novamente" : "Nova cotação"}
      </Link>
    </section>
  );
}
