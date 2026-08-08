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
  return <PrivateShell><section className="mx-auto max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">Sua conta</p><h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">Configurações</h1><p className="mt-3 text-lg text-black/55">Personalize sua experiência no CotaMap.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{preferences.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-3xl bg-white p-6 shadow-sm"><div className="grid size-11 place-items-center rounded-2xl bg-orange-50 text-[#F97316]"><Icon className="size-5" /></div><h2 className="mt-5 text-lg font-black">{title}</h2><p className="mt-2 text-sm leading-6 text-black/55">{description}</p><p className="mt-5 text-xs font-bold text-black/35">Disponível em breve</p></article>)}</div><div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"><h2 className="font-black">Conta e segurança</h2><p className="mt-2 text-sm text-black/55">Para editar seus dados pessoais ou alterar sua senha, acesse seu perfil.</p><a href="/perfil" className="mt-4 inline-flex rounded-xl bg-[#111827] px-4 py-3 text-sm font-bold text-white">Abrir meu perfil</a></div></section></PrivateShell>;
}
