"use client";

import { Clock3 } from "lucide-react";

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

export function Countdown({ seconds }: { seconds: number }) {
  return (
    <div className="border-[#111827]/8 rounded-2xl border bg-[#F3F4F6] p-4" aria-live="off">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#111827]/45">
        <Clock3 className="size-4 text-[#F97316]" aria-hidden="true" />
        Tempo restante
      </p>
      <p
        className="mt-2 font-mono text-3xl font-black tracking-[-0.05em] text-[#111827]"
        aria-label={`${Math.floor(seconds / 60)} minutos e ${seconds % 60} segundos restantes`}
      >
        {formatTime(seconds)}
      </p>
    </div>
  );
}
