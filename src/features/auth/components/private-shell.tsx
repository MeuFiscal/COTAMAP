"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { PushBootstrap } from "@/features/push/components/push-bootstrap";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { ensurePlatformAdmin } from "@/services/auth/auth-service";

type NavigationItem = { label: string; href: string };

const customerNavigation: NavigationItem[] = [
  { label: "Início", href: "/dashboard" },
  { label: "Nova cotação", href: "/nova-cotacao" },
  { label: "Minhas cotações", href: "/cotacoes" },
  { label: "Meus pedidos", href: "/dashboard" },
  { label: "Perfil", href: "/perfil" },
  { label: "Configurações", href: "/perfil" },
  { label: "Ajuda", href: "/#faq" },
];

const businessNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/empresa/dashboard" },
  { label: "Solicitações", href: "/empresa/chamados" },
  { label: "Pedidos", href: "/empresa/pedidos" },
  { label: "Empresa", href: "/empresa/configuracoes/localizacao" },
  { label: "Funcionários", href: "/empresa/funcionarios" },
  { label: "Plano", href: "/empresa/plano" },
  { label: "Configurações", href: "/empresa/configuracoes/localizacao" },
  { label: "Ajuda", href: "/#faq" },
];

export function PrivateShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const adminQuery = useQuery({
    queryKey: ["platform-admin-access", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      await ensurePlatformAdmin();
      const { data, error } = await createClient().from("platform_admins").select("id").eq("active", true).maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
    staleTime: 60_000,
  });
  const [open, setOpen] = useState(false);
  const isBusiness = user?.accountType === "business" || pathname.startsWith("/empresa");
  const isAdmin = pathname.startsWith("/admin");
  const home = isAdmin ? "/admin" : isBusiness ? "/empresa/dashboard" : "/dashboard";
  const navigation = isAdmin ? [{ label: "Dashboard", href: "/admin" }, { label: "Empresas", href: "/admin#empresas" }, { label: "SaaS", href: "/admin#saas" }, { label: "Auditoria", href: "/admin#auditoria" }] : isBusiness ? businessNavigation : customerNavigation;
  const adminLink = adminQuery.data === true ? { label: "Painel Admin", href: "/admin" } : null;

  return (
    <main className="bg-[#F3F4F6] pb-[env(safe-area-inset-bottom)]">
      <PushBootstrap />
      <header className="sticky top-0 z-40 border-b border-[#111827]/5 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={home} aria-label="Ir para o início" className="inline-flex items-center gap-2 font-black tracking-[-0.04em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-white">📍</span>
            <span className="text-xl">Cota<span className="text-[#F97316]">Map</span></span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {navigation.slice(0, 4).map((item) => <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#F3F4F6] hover:text-[#F97316]">{item.label}</Link>)}
            {adminLink ? <Link href={adminLink.href} className="rounded-xl px-3 py-2 text-sm font-bold text-[#F97316] hover:bg-[#FFF7ED]">{adminLink.label}</Link> : null}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/perfil" className="hidden rounded-xl px-3 py-2 text-sm font-bold hover:text-[#F97316] sm:inline-flex">Perfil</Link>
            <NotificationBell />
            <div className="hidden sm:block"><LogoutButton /></div>
            <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl border border-[#111827]/10 bg-white lg:hidden"><Menu className="size-5" /></button>
          </div>
        </div>
      </header>
      {open ? <div className="fixed inset-0 z-50 lg:hidden" role="presentation" onClick={() => setOpen(false)}><div className="absolute inset-0 bg-[#111827]/35" /><aside role="dialog" aria-label="Menu principal" className="absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,22rem)] flex-col bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#F97316]">{isAdmin ? "Admin" : isBusiness ? "Empresa" : "Cliente"}</p><p className="mt-1 font-black">{user?.fullName || "Sua conta"}</p></div><button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl bg-[#F3F4F6]"><X className="size-5" /></button></div><nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Menu móvel">{navigation.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]">{item.label}</Link>)}{adminLink ? <Link href={adminLink.href} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 font-bold text-[#F97316] hover:bg-[#FFF7ED]">{adminLink.label}</Link> : null}<Link href="/notificacoes" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]">Notificações</Link></nav><LogoutButton /></aside></div> : null}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </main>
  );
}
