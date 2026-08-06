"use client";

import { CheckCircle2, Radio, Satellite, Search } from "lucide-react";
import { motion } from "framer-motion";

import type { SearchPhase } from "@/features/quotes/search/search-types";

const phaseContent = {
  locating: { icon: Search, eyebrow: "Localizando", title: "Procurando empresas próximas..." },
  sending: { icon: Satellite, eyebrow: "Conectando", title: "Enviando solicitações..." },
  waiting: { icon: Radio, eyebrow: "Em andamento", title: "Aguardando respostas..." },
  receiving: { icon: CheckCircle2, eyebrow: "Boas notícias", title: "Recebendo cotações..." },
} as const;

export function SearchStatus({ phase }: { phase: SearchPhase }) {
  const content = phaseContent[phase];
  const Icon = content.icon;

  return (
    <motion.div
      key={phase}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-live="polite"
    >
      <p className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#F97316] lg:justify-start">
        <Icon className="size-4" aria-hidden="true" />
        {content.eyebrow}
      </p>
      <h2 className="mt-3 text-center text-2xl font-black tracking-[-0.035em] text-[#111827] sm:text-3xl lg:text-left">
        {content.title}
      </h2>
      <p className="mt-2 text-center text-sm leading-6 text-[#111827]/50 lg:text-left">
        Você pode permanecer nesta tela enquanto simulamos o contato com as lojas.
      </p>
    </motion.div>
  );
}
