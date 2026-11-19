"use client";

import { Bell, LockKeyhole, ShieldCheck, SlidersHorizontal } from "lucide-react";

import { PrivateShell } from "@/features/auth/components/private-shell";

const preferences = [
 { icon: Bell, title: "Notificações", description: "Receba avisos sobre novas cotações e pedidos." },
 { icon: SlidersHorizontal, title: "Preferências", description: "Escolha como quer acompanhar sua jornada." },
 { icon: ShieldCheck, title: "Privacidade", description: "Entenda como seus dados são protegidos." },
 { icon: LockKeyhole, title: "Permissões", description: "Gerencie permissões do navegador e localização." },
];

export default function SettingsPage() {
 return (
 <PrivateShell>
 {/* Hero Premium */}
 <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
 <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
 <div className="relative mx-auto max-w-[1440px]">
 <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Sua conta</p>
 <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Configurações</h1>
 <p className="mt-3 text-base text-white/75 sm:text-lg">Personalize sua experiência no CotaMap.</p>
 </div>
 </section>

 <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
 <div className="-mt-8 grid gap-4 sm:grid-cols-2">
 {preferences.map(({ icon: Icon, title, description }) => (
 <article
 key={title}
 className="group rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)] transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_18px_36px_rgba(249,115,22,.12)]"
 >
 <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316] transition group-hover:bg-[#F97316] group-hover:text-white">
 <Icon className="size-5" />
 </span>
 <h2 className="mt-5 text-lg font-black text-slate-950">{title}</h2>
 <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
 <p className="mt-5 text-xs font-bold text-slate-400">Disponível em breve</p>
 </article>
 ))}
 </div>

 <div className="mt-6 rounded-[1.5rem] border border-white bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,.08)] sm:p-8">
 <div className="flex items-center gap-3">
 <span className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]">
 <ShieldCheck className="size-5" />
 </span>
 <div>
 <h2 className="text-xl font-black text-slate-950">Conta e segurança</h2>
 <p className="mt-1 text-sm text-slate-500">
 Para editar seus dados pessoais ou alterar sua senha, acesse seu perfil.
 </p>
 </div>
 </div>
 <a
 href="/perfil"
 className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#171717] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#F97316]"
 >
 Abrir meu perfil
 </a>
 </div>
 </div>
 </PrivateShell>
 );
}
