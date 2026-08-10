"use client";

import { ArrowLeft, Bell, FileText, HelpCircle, Home, Menu, Package, Search, Settings, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { PushBootstrap } from "@/features/push/components/push-bootstrap";
import { useAuth } from "@/hooks/use-auth";

type NavigationItem = { label: string; href: string; icon: typeof Home };

const customerNavigation: NavigationItem[] = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Nova cotação", href: "/nova-cotacao", icon: Search },
  { label: "Minhas cotações", href: "/cotacoes", icon: FileText },
  { label: "Meus pedidos", href: "/dashboard", icon: Package },
  { label: "Perfil", href: "/perfil", icon: UserRound },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
  { label: "Ajuda", href: "/#faq", icon: HelpCircle },
];

const businessNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/empresa/dashboard", icon: Home },
  { label: "Solicitações", href: "/empresa/chamados", icon: Search },
  { label: "Pedidos", href: "/empresa/pedidos", icon: Package },
  { label: "Empresa", href: "/empresa/configuracoes", icon: Settings },
  { label: "Funcionários", href: "/empresa/funcionarios", icon: Users },
  { label: "Plano", href: "/empresa/plano", icon: FileText },
  { label: "Configurações", href: "/empresa/configuracoes", icon: Settings },
  { label: "Ajuda", href: "/#faq", icon: HelpCircle },
];

export function PrivateShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const isBusiness = user?.accountType === "business" || pathname.startsWith("/empresa");
  const isAdminRoute = pathname.startsWith("/admin");
  const home = isAdminRoute ? "/admin" : isBusiness ? "/empresa/dashboard" : "/dashboard";
  const navigation: NavigationItem[] = isAdminRoute ? [{ label: "Dashboard", href: "/admin", icon: Home }, { label: "Empresas", href: "/admin#empresas", icon: Package }, { label: "SaaS", href: "/admin#saas", icon: FileText }, { label: "Auditoria", href: "/admin#auditoria", icon: Settings }] : isBusiness ? businessNavigation : customerNavigation;
  const adminLink = isAdmin ? { label: "Painel Admin", href: "/admin" } : null;

  return (
    <main className="min-h-[100dvh] bg-[#F3F4F6] pb-[env(safe-area-inset-bottom)]">
      <PushBootstrap />
      <header className="sticky top-0 z-40 border-b border-[#111827]/5 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" aria-label="Voltar" title="Voltar" onClick={() => { if (window.history.length > 1) router.back(); else router.push(home); }} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#111827]/10 bg-white transition hover:border-[#F97316] hover:text-[#F97316]"><ArrowLeft className="size-5" /></button>
          <Link href={home} aria-label="Ir para o início" className="inline-flex items-center gap-2 font-black tracking-[-0.04em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-white">📍</span>
            <span className="text-xl">Cota<span className="text-[#F97316]">Map</span></span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {navigation.slice(0, 5).map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#F3F4F6] hover:text-[#F97316]"><item.icon className="size-4" />{item.label}</Link>)}
            {adminLink ? <Link href={adminLink.href} className="rounded-xl px-3 py-2 text-sm font-bold text-[#F97316] hover:bg-[#FFF7ED]">{adminLink.label}</Link> : null}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/perfil" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold hover:text-[#F97316] sm:inline-flex"><UserRound className="size-4" />Perfil</Link>
            <NotificationBell />
            <div className="hidden sm:block"><LogoutButton /></div>
            <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl border border-[#111827]/10 bg-white lg:hidden"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>
      {open ? <div className="fixed inset-0 z-50 lg:hidden" role="presentation" onClick={() => setOpen(false)}><div className="absolute inset-0 bg-[#111827]/35" /><aside role="dialog" aria-label="Menu principal" className="absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,22rem)] flex-col bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#F97316]">{isAdmin ? "Admin" : isBusiness ? "Empresa" : "Cliente"}</p><p className="mt-1 font-black">{user?.fullName || "Sua conta"}</p></div><button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl bg-[#F3F4F6]"><X className="size-5" /></button></div><nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Menu móvel">{navigation.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]"><item.icon className="size-5" />{item.label}</Link>)}{adminLink ? <Link href={adminLink.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold text-[#F97316] hover:bg-[#FFF7ED]"><Settings className="size-5" />{adminLink.label}</Link> : null}<Link href="/notificacoes" onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]"><Bell className="size-5" />Notificações</Link></nav><LogoutButton /></aside></div> : null}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </main>
  );
}
