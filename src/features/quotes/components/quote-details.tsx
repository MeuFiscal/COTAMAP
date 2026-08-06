"use client";

import { Clock3, CreditCard, MapPin } from "lucide-react";
import { motion } from "framer-motion";

import type { QuoteComparison } from "@/features/quotes/comparison/quote-types";

export function QuoteDetails({ quote }: { quote: QuoteComparison }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="border-[#111827]/8 mt-5 border-t pt-5">
        <p className="text-sm leading-6 text-[#111827]/65">{quote.description}</p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <Detail icon={MapPin} label="Endereço" value={quote.address} />
          <Detail icon={Clock3} label="Horário" value={quote.openingHours} />
        </dl>
        <div className="mt-3 rounded-2xl bg-[#F3F4F6] p-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#111827]/45">
            <CreditCard className="size-4 text-[#F97316]" aria-hidden="true" />
            Formas de pagamento
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {quote.paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-lg bg-[#FFFFFF] px-3 py-1.5 text-xs font-bold text-[#111827]"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-[#F3F4F6] p-4">
      <Icon className="mt-0.5 size-5 shrink-0 text-[#F97316]" aria-hidden="true" />
      <div>
        <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#111827]/40">{label}</dt>
        <dd className="mt-1 text-sm font-bold text-[#111827]">{value}</dd>
      </div>
    </div>
  );
}
