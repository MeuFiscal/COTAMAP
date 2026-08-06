"use client";

import { Check, Store } from "lucide-react";
import { motion } from "framer-motion";

import type { BusinessProgress } from "@/features/quotes/search/search-types";

export function BusinessProgressCard({
  business,
  index,
}: {
  business: BusinessProgress;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border-[#111827]/8 flex items-center gap-4 rounded-2xl border bg-[#FFFFFF] p-4 shadow-[0_10px_28px_rgba(17,24,39,0.04)]"
    >
      <span className="relative grid size-12 shrink-0 place-items-center rounded-2xl bg-[#F3F4F6] text-[#111827]">
        <Store className="size-5" aria-hidden="true" />
        <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#F97316] text-[#FFFFFF]">
          <Check className="size-3" aria-hidden="true" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm text-[#111827]">{business.name}</strong>
        <span className="mt-1 block text-xs font-semibold text-[#F97316]">{business.status}</span>
      </span>
      <span className="size-2 animate-pulse rounded-full bg-[#F97316]" aria-hidden="true" />
    </motion.li>
  );
}
