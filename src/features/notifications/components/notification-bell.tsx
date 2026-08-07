"use client";

import { Bell, CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useNotifications } from "@/features/notifications/hooks/use-notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const query = useNotifications();
  const notifications = query.data ?? [];
  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} className={`relative grid size-11 place-items-center rounded-xl hover:bg-[#F3F4F6] ${unread ? "text-[#F97316]" : ""}`}>
        <Bell className="size-5" />
        {unread ? <span className="absolute right-0 top-0 grid min-w-5 place-items-center rounded-full bg-[#F97316] px-1 text-[10px] font-black text-white">{unread > 99 ? "99+" : unread}</span> : null}
      </button>
      {open ? <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" /> : null}
      {open ? <section role="dialog" aria-label="Notificações recentes" className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] rounded-2xl border border-[#111827]/10 bg-white p-4 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-black">Notificações</h2><button type="button" aria-label="Fechar notificações" onClick={() => setOpen(false)}><X className="size-4" /></button></div>{query.isLoading ? <p className="py-8 text-center text-sm text-black/55">Carregando...</p> : query.error ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto size-8 text-[#F97316]" /><p className="mt-2 text-sm font-bold">Nenhuma notificação.</p></div> : !notifications.length ? <p className="py-8 text-center text-sm text-black/55">Nenhuma notificação.</p> : <div className="mt-3 space-y-2">{notifications.slice(0, 4).map((item) => <div key={item.id} className={`rounded-xl p-3 text-sm ${item.readAt ? "bg-[#F3F4F6]" : "bg-[#FFF7ED]"}`}><p className="font-bold">{item.title}</p><p className="mt-1 text-black/60">{item.message}</p></div>)}</div>}<Link href="/notificacoes" onClick={() => setOpen(false)} className="mt-4 block rounded-xl bg-[#111827] px-4 py-3 text-center text-sm font-bold text-white">Ver todas</Link></section> : null}
    </div>
  );
}
