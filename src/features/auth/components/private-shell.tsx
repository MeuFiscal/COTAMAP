"use client";

import { ArrowLeft, Bell, CreditCard, FileText, HelpCircle, Home, Menu, Package, Search, Settings, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { AvatarEditor } from "@/features/auth/components/avatar-editor";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { PushBootstrap } from "@/features/push/components/push-bootstrap";
import { useAuth } from "@/hooks/use-auth";
import { getSignedAvatarUrl } from "@/services/auth/avatar-service";

type NavigationItem = { label: string; href: string; icon: typeof Home };

const customerNavigation: NavigationItem[] = [
  { label: "Início", href: "/dashboard", icon: Home },
  { label: "Nova cotação", href: "/nova-cotacao", icon: Search },
  { label: "Minhas cotações", href: "/cotacoes", icon: FileText },
  { label: "Histórico", href: "/historico", icon: FileText },
  { label: "Meus pedidos", href: "/pedidos", icon: Package },
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
  { label: "Meu Plano", href: "/empresa/plano", icon: FileText },
  { label: "Configurações", href: "/empresa/configuracoes", icon: Settings },
  { label: "Ajuda", href: "/#faq", icon: HelpCircle },
];

export function PrivateShell({ children, businessRole, wide = false, dashboard = false }: { children: ReactNode; businessRole?: string | null; wide?: boolean; dashboard?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

  const isBusiness = pathname.startsWith("/empresa") || Boolean(businessRole);
  const isAdminRoute = pathname.startsWith("/admin");
  const premiumHeader = isBusiness || (dashboard && !isAdminRoute);
  const home = isAdminRoute ? "/admin" : isBusiness ? "/empresa/dashboard" : "/dashboard";
  const navigation: NavigationItem[] = isAdminRoute
    ? [{ label: "Visão geral", href: "/admin", icon: Home }, { label: "Empresas", href: "/admin#empresas", icon: Package }, { label: "Clientes", href: "/admin#clientes", icon: UserRound }, { label: "Funcionários", href: "/admin#funcionarios", icon: Users }, { label: "Auditoria", href: "/admin#auditoria", icon: Settings }, { label: "Planos", href: "/admin#saas", icon: FileText }, { label: "Checkouts", href: "/admin#checkouts", icon: CreditCard }]
    : isBusiness
      ? businessNavigation.filter((item) => businessRole === "owner" || !["/empresa/configuracoes", "/empresa/funcionarios", "/empresa/plano"].includes(item.href))
      : customerNavigation;
  const adminLink = isAdmin ? { label: "Painel Admin", href: "/admin" } : null;

  // Compatibilidade com avatar_url legado + novo avatar_path
  const legacyAvatarUrl = session?.user.user_metadata?.avatar_url;
  const hasLegacyAvatar = typeof legacyAvatarUrl === "string" && /^https?:\/\//.test(legacyAvatarUrl);
  const avatarPath = session?.user.user_metadata?.avatar_path as string | undefined;
  const initials = (user?.fullName || "Usuário").split(" ").filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase();

  // Carregar URL assinada quando houver avatar_path
  useEffect(() => {
    if (!avatarPath) {
      setSignedAvatarUrl(null);
      return;
    }
    let cancelled = false;
    void getSignedAvatarUrl(avatarPath).then((url) => {
      if (!cancelled) setSignedAvatarUrl(url);
    });
    return () => { cancelled = true; };
  }, [avatarPath]);

  // Fallback para avatar_url legado se não houver signed URL
  const displayAvatarUrl = signedAvatarUrl ?? (hasLegacyAvatar ? legacyAvatarUrl : null);

  const handleAvatarUpdate = useCallback((newUrl: string | null) => {
    setSignedAvatarUrl(newUrl);
  }, []);

  return (
    <main className={`min-h-[100dvh] pb-[env(safe-area-inset-bottom)] ${isAdminRoute ? "bg-[#F6F7F9]" : "bg-[#F3F4F6]"}`}>
      <PushBootstrap />
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${premiumHeader ? "border-white/10 bg-[#171717]/95 text-white shadow-[0_12px_40px_rgba(17,17,17,.16)]" : "border-[#111827]/5 bg-white/95"}`}>
        <div className={`mx-auto flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 ${wide ? "max-w-[1440px]" : "max-w-6xl"}`}>
          <button type="button" aria-label="Voltar" title="Voltar" onClick={() => { if (window.history.length > 1) router.back(); else router.push(home); }} className={`grid size-10 shrink-0 place-items-center rounded-xl border transition hover:border-[#F97316] hover:text-[#F97316] ${premiumHeader ? "border-white/15 bg-white/5" : "border-[#111827]/10 bg-white"}`}><ArrowLeft className="size-5" /></button>
          <Link href={home} aria-label="Ir para o início" className="inline-flex items-center gap-2 font-black tracking-[-0.04em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-white">📍</span>
            <span className="text-xl">Cota<span className="text-[#F97316]">Map</span></span>
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
            {navigation.slice(0, 6).filter((item) => !(dashboard && !isBusiness && item.href === "/perfil")).map((item) => {
              const active = pathname === item.href;
              return <Link key={`${item.href}-${item.label}`} href={item.href} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition ${premiumHeader ? active ? "bg-[#F97316] text-white shadow-[0_8px_20px_rgba(249,115,22,.34)]" : "text-white/80 hover:bg-white/10 hover:text-white" : "hover:bg-[#F3F4F6] hover:text-[#F97316]"}`}><item.icon className="size-4" />{item.label}</Link>;
            })}
            {adminLink ? <Link href={adminLink.href} className="rounded-xl px-3 py-2 text-sm font-bold text-[#F97316] hover:bg-[#FFF7ED]">{adminLink.label}</Link> : null}
          </nav>
          <div className="flex items-center gap-1">
            <NotificationBell />
            {premiumHeader ? (
              <button
                type="button"
                aria-label="Editar foto de perfil"
                onClick={() => setAvatarEditorOpen(true)}
                className={`group relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border text-xs font-black transition hover:ring-2 hover:ring-[#F97316]/50 ${displayAvatarUrl ? "border-orange-400/70 bg-slate-800" : "border-orange-400/55 bg-orange-500 text-white"}`}
                style={displayAvatarUrl ? { backgroundImage: `url("${displayAvatarUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
              >
                {displayAvatarUrl ? <span className="sr-only">{user?.fullName}</span> : initials}
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <UserRound className="size-4 text-white" />
                </span>
              </button>
            ) : null}
            <div className="hidden sm:block"><LogoutButton /></div>
            <button type="button" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)} className={`grid size-11 place-items-center rounded-xl border lg:hidden ${premiumHeader ? "border-white/15 bg-white/10 text-white" : "border-[#111827]/10 bg-white"}`}><Menu className="size-5" /></button>
          </div>
        </div>
      </header>
      {open ? <div className="fixed inset-0 z-50 lg:hidden" role="presentation" onClick={() => setOpen(false)}><div className="absolute inset-0 bg-[#111827]/35" /><aside role="dialog" aria-label="Menu principal" className="absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,22rem)] flex-col bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-widest text-[#F97316]">{isAdminRoute ? "Admin" : isBusiness ? "Empresa" : "Cliente"}</p><p className="mt-1 font-black">{user?.fullName || "Sua conta"}</p></div><button type="button" aria-label="Fechar menu" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl bg-[#F3F4F6]"><X className="size-5" /></button></div><nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Menu móvel">{navigation.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]"><item.icon className="size-5" />{item.label}</Link>)}{adminLink ? <Link href={adminLink.href} onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold text-[#F97316] hover:bg-[#FFF7ED]"><Settings className="size-5" />{adminLink.label}</Link> : null}<Link href="/notificacoes" onClick={() => setOpen(false)} className="inline-flex items-center gap-3 rounded-xl px-4 py-3.5 font-bold hover:bg-[#FFF7ED] hover:text-[#F97316]"><Bell className="size-5" />Notificações</Link></nav><LogoutButton /></aside></div> : null}
      <div className={`mx-auto ${dashboard ? "max-w-none px-0 pb-10 pt-0" : `px-4 py-8 sm:px-6 sm:py-10 ${wide ? "max-w-[1440px]" : "max-w-6xl"}`} ${isAdminRoute ? "lg:max-w-[1320px] lg:py-10" : ""}`}>{children}</div>
      {avatarEditorOpen && session?.user?.id ? (
        <AvatarEditor
          userId={session.user.id}
          currentPath={avatarPath ?? null}
          initials={initials}
          onUpdate={handleAvatarUpdate}
          onClose={() => setAvatarEditorOpen(false)}
        />
      ) : null}
    </main>
  );
}
