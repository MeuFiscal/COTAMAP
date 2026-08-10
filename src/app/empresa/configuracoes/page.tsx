"use client";

import { Building2, MapPin, UserRound, Users } from "lucide-react";
import Link from "next/link";

import { BusinessShell } from "@/features/business/components/business-shell";

const sections = [
  { href: "/empresa/configuracoes/localizacao", icon: MapPin, title: "Localização da loja", description: "Atualize a posição usada para conectar clientes próximos." },
  { href: "/empresa/funcionarios", icon: Users, title: "Funcionários", description: "Adicione, edite e gerencie os operadores da empresa." },
  { href: "/perfil", icon: UserRound, title: "Perfil do responsável", description: "Atualize seus dados pessoais e informações de contato." },
  { href: "/empresa/configuracoes/cadastrais", icon: Building2, title: "Dados cadastrais", description: "Edite nome, telefone e endereço público da sua autopeça." },
] as const;

export default function BusinessSettingsPage() {
  return <BusinessShell><section className="mx-auto max-w-4xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#F97316]">Empresa</p><h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">Configurações da loja</h1><p className="mt-3 max-w-2xl text-black/55">Conclua os dados essenciais para sua autopeça aparecer corretamente para os clientes e operar todos os chamados.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{sections.map(({ href, icon: Icon, title, description }) => <Link key={href} href={href} className="group rounded-3xl border border-[#111827]/5 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F97316]/30 hover:shadow-md"><span className="grid size-11 place-items-center rounded-2xl bg-[#FFF7ED] text-[#F97316]"><Icon className="size-5" aria-hidden="true" /></span><h2 className="mt-5 text-xl font-black group-hover:text-[#F97316]">{title}</h2><p className="mt-2 text-sm leading-6 text-black/55">{description}</p><span className="mt-5 inline-flex text-sm font-black text-[#F97316]">Abrir configuração →</span></Link>)}</div></section></BusinessShell>;
}
