"use client";

import { BellRing, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function QuoteArrivalToast({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          role="status"
          className="fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#111827] p-4 text-[#FFFFFF] shadow-[0_24px_60px_rgba(17,24,39,0.3)] sm:left-auto sm:right-6"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F97316]">
            <BellRing className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="block text-sm">Uma nova cotação chegou</strong>
            <span className="mt-0.5 block text-xs text-[#FFFFFF]/55">
              A primeira loja já respondeu.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl text-[#FFFFFF]/60 transition hover:bg-[#FFFFFF]/10 hover:text-[#FFFFFF]"
            aria-label="Fechar aviso"
          >
            <X className="size-4" />
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
