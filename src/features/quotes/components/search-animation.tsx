"use client";

import { Building2, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const pins = [
  { className: "left-[12%] top-[22%]", delay: 0.4 },
  { className: "right-[13%] top-[31%]", delay: 1.1 },
  { className: "bottom-[13%] left-[22%]", delay: 1.8 },
] as const;

export function SearchAnimation() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-[20rem]"
      role="img"
      aria-label="Radar simulando a busca por autopeças próximas"
    >
      {["inset-[8%]", "inset-[24%]", "inset-[40%]"].map((position, index) => (
        <motion.span
          key={position}
          className={`absolute ${position} rounded-full border border-[#F97316]/25`}
          animate={{ scale: [0.82, 1.04, 0.82], opacity: [0.25, 0.8, 0.25] }}
          transition={{ duration: 3.5, delay: index * 0.35, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        className="absolute inset-[40%] grid place-items-center rounded-full bg-[#F97316] text-[#FFFFFF] shadow-[0_16px_36px_rgba(249,115,22,0.28)]"
        animate={{ scale: [1, 1.07, 1] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <MapPin className="size-8" aria-hidden="true" />
      </motion.div>
      {pins.map(({ className, delay }) => (
        <motion.span
          key={className}
          className={`absolute ${className} border-[#111827]/8 grid size-11 place-items-center rounded-2xl border bg-[#FFFFFF] text-[#111827] shadow-[0_12px_28px_rgba(17,24,39,0.1)]`}
          initial={{ opacity: 0, scale: 0.6, y: 8 }}
          animate={{ opacity: [0, 1, 1], scale: [0.6, 1, 1], y: [8, 0, 0] }}
          transition={{ duration: 3.4, delay, repeat: Infinity, repeatDelay: 0.7 }}
        >
          <Building2 className="size-5" aria-hidden="true" />
        </motion.span>
      ))}
    </div>
  );
}
