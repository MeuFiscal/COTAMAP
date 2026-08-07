"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Clock3, MapPin, Radio, Sparkles, Store } from "lucide-react";
import Link from "next/link";
import { Container } from "./container";

const pins = [
  { x: 22, y: 35, label: "Auto Peças Silva", delay: 0.1 },
  { x: 67, y: 24, label: "Centro Auto Parts", delay: 0.35 },
  { x: 78, y: 68, label: "Paraná Peças", delay: 0.55 },
  { x: 38, y: 76, label: "Cota recebida", delay: 0.75 },
] as const;

function LivingMap() {
  return <div className="relative min-h-[410px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#172033] shadow-2xl shadow-black/30 sm:min-h-[500px]" aria-label="Mapa ilustrativo de empresas próximas e cotações" role="img">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(32deg, transparent 48%, #94a3b8 49%, #94a3b8 51%, transparent 52%), linear-gradient(112deg, transparent 47%, #64748b 48%, #64748b 50%, transparent 51%), linear-gradient(0deg, transparent 49%, #475569 50%, transparent 51%)", backgroundSize: "150px 130px, 190px 170px, 100% 120px" }} />
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      <motion.path d="M10 84 C28 65 27 43 46 46 S64 29 89 12" fill="none" stroke="#f97316" strokeWidth="0.7" strokeDasharray="3 2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} />
      <path d="M10 84 C30 55 50 67 63 49 S74 30 89 12" fill="none" stroke="#ffffff" strokeOpacity=".18" strokeWidth=".8" />
    </svg>
    <motion.div className="absolute left-[8%] top-[77%] grid size-14 place-items-center rounded-full bg-[#f97316] text-white shadow-[0_0_0_12px_rgba(249,115,22,.15)]" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}><MapPin className="size-6" /></motion.div>
    {pins.map((pin) => <motion.div key={pin.label} className="absolute" style={{ left: `${pin.x}%`, top: `${pin.y}%` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: pin.delay, type: "spring" }}><span className="grid size-9 place-items-center rounded-full border border-white/20 bg-white text-[#f97316] shadow-xl"><Store className="size-4" /></span><span className="absolute left-1/2 top-11 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0f172a]/90 px-3 py-1.5 text-[10px] font-bold text-white sm:block">{pin.label}</span></motion.div>)}
    <motion.div className="absolute bottom-6 right-5 w-56 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}><div className="flex items-center gap-2 text-xs font-bold text-white/70"><Radio className="size-3 text-[#fb923c]" /> Busca em tempo real</div><p className="mt-2 text-sm font-black text-white">4 lojas encontradas</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"><motion.div className="h-full rounded-full bg-[#f97316]" initial={{ width: 0 }} animate={{ width: "82%" }} transition={{ duration: 1.5, delay: .8 }} /></div></motion.div>
  </div>;
}

export function HeroSection() {
  return <section id="inicio" className="overflow-hidden bg-[#0b1120] pb-20 pt-8 text-white sm:pb-28 sm:pt-12 lg:pb-36"><Container><div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16"><div><div className="inline-flex items-center gap-2 rounded-full border border-[#fb923c]/30 bg-[#f97316]/10 px-3 py-2 text-xs font-black text-[#fed7aa]"><Sparkles className="size-3.5" /> Cotações inteligentes para autopeças</div><h1 className="mt-7 max-w-2xl text-balance text-5xl font-black leading-[.98] tracking-[-.065em] sm:text-7xl">Encontre a peça certa.<br /><span className="text-[#fb923c]">Receba várias cotações.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/65 sm:text-xl">Uma solicitação chega às autopeças próximas. Compare preços, escolha com segurança e retire sem perder tempo.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/criar-conta/cliente" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f97316] px-6 py-4 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:bg-[#fb923c]">Começar agora <ArrowRight className="size-4" /></Link><a href="#como-funciona" className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-6 py-4 text-sm font-black text-white/80 transition hover:border-white/40 hover:text-white">Como funciona</a></div><div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/55"><span className="flex items-center gap-2"><Check className="size-4 text-[#fb923c]" /> Até 5 propostas</span><span className="flex items-center gap-2"><Clock3 className="size-4 text-[#fb923c]" /> Em poucos minutos</span></div></div><LivingMap /></div></Container></section>;
}
