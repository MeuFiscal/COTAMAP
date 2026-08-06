"use client";

import { MapPinPlus, RotateCcw } from "lucide-react";

export function EmptyState({
  onExpandRadius,
  onRetry,
}: {
  onExpandRadius: () => void;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-[#111827]/5 bg-[#FFFFFF] p-7 text-center shadow-sm sm:p-10">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
        <MapPinPlus className="size-8" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">Ainda não recebemos respostas</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#111827]/55">
        Algumas peças exigem uma busca um pouco maior. Você pode ampliar o raio ou tentar novamente.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onExpandRadius}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 text-sm font-black text-[#FFFFFF] hover:bg-[#111827]"
        >
          <MapPinPlus className="size-4" />
          Ampliar raio
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#111827]/10 px-5 text-sm font-black hover:border-[#F97316] hover:text-[#F97316]"
        >
          <RotateCcw className="size-4" />
          Nova tentativa
        </button>
      </div>
    </section>
  );
}
