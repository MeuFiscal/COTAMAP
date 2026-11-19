"use client";

import Link from "next/link";
import { Bell, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { deleteNotification, markAllNotificationsRead, markNotificationRead, type AppNotification } from "@/services/notifications/notification-service";

const filters = [
  ["all", "Todas"],
  ["unread", "Não lidas"],
  ["orders", "Pedidos"],
  ["quotes", "Cotações"],
  ["system", "Sistema"],
  ["admin", "Administrativo"],
] as const;

function target(n: AppNotification) {
  if (!n.entityId) return null;
  if (n.entityType === "order") return `/pedido/${n.entityId}`;
  if (n.entityType === "quotation") return `/cotacoes/${n.entityId}`;
  return null;
}

export default function NotificationsPage() {
  const query = useNotifications();
  const client = useQueryClient();
  const [filter, setFilter] = useState("all");
  const mark = useMutation({ mutationFn: markNotificationRead, onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }) });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }) });
  const remove = useMutation({ mutationFn: deleteNotification, onSuccess: () => void client.invalidateQueries({ queryKey: ["notifications"] }) });

  const filtered = useMemo(
    () =>
      (query.data ?? []).filter(
        (n) =>
          filter === "all" ||
          (filter === "unread" && !n.readAt) ||
          (filter === "orders" && n.type.includes("order")) ||
          (filter === "quotes" && n.type.includes("quote")) ||
          (filter === "system" && n.type.includes("system")) ||
          (filter === "admin" && n.type.includes("admin")),
      ),
    [filter, query.data],
  );

  const groups = useMemo(() => {
    const now = new Date();
    const result = new Map<string, AppNotification[]>();
    for (const item of filtered) {
      const days = Math.floor((now.getTime() - new Date(item.createdAt).getTime()) / 86400000);
      const key = days === 0 ? "Hoje" : days === 1 ? "Ontem" : days < 7 ? "Últimos 7 dias" : "Mais antigas";
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return result;
  }, [filtered]);

  return (
    <PrivateShell>
      {/* Hero Premium */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-[#171717] px-6 pb-16 pt-9 text-white shadow-[0_24px_55px_rgba(23,23,23,.25)] sm:px-10 sm:pt-10">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_100%,rgba(255,107,0,.26),transparent_31%),radial-gradient(circle_at_86%_12%,rgba(255,107,0,.32),transparent_19%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Central de atualizações</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Notificações</h1>
          <p className="mt-3 text-base text-white/75 sm:text-lg">Atualizações em tempo real da sua conta.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || !query.data?.some((n) => !n.readAt)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              <Bell className="size-4" />
              {markAll.isPending ? "Marcando..." : "Marcar todas como lidas"}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {/* Filtros */}
        <div className="-mt-8 flex flex-wrap gap-2">
          {filters.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                filter === value
                  ? "bg-[#F97316] text-white shadow-[0_8px_20px_rgba(249,115,22,.3)]"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:text-[#F97316]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {query.isLoading ? (
          <div className="mt-8 space-y-4" aria-label="Carregando notificações">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[1.5rem] bg-white/70" />
            ))}
          </div>
        ) : query.error ? (
          <p role="alert" className="mt-8 rounded-[1.5rem] bg-red-50 p-6 text-sm font-semibold text-red-700">
            Não foi possível carregar notificações. Tente novamente.
          </p>
        ) : !filtered.length ? (
          <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-12 text-center shadow-[0_12px_32px_rgba(15,23,42,.07)]">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-50 text-3xl">🔔</div>
            <p className="mt-4 text-xl font-black text-slate-950">Nenhuma notificação.</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
              Quando houver atualizações na sua conta, elas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {[...groups.entries()].map(([group, items]) => (
              <section key={group}>
                <h2 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">{group}</h2>
                <div className="space-y-3">
                  {items.map((notification) => (
                    <article
                      key={notification.id}
                      className={`group relative rounded-[1.5rem] border bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,.1)] ${
                        notification.readAt ? "border-slate-100" : "border-orange-200 bg-orange-50/30"
                      }`}
                    >
                      {!notification.readAt && (
                        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#F97316]" aria-label="Não lida" />
                      )}
                      <div className="flex items-start justify-between gap-3 pl-2">
                        <div className="min-w-0">
                          <p className="font-black text-slate-950">{notification.title}</p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">{notification.message}</p>
                          <time className="mt-2 block text-xs font-semibold text-slate-400">
                            {new Date(notification.createdAt).toLocaleString("pt-BR")}
                          </time>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                            notification.readAt ? "bg-slate-100 text-slate-500" : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {notification.readAt ? "Lida" : "Nova"}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 pl-2">
                        {target(notification) ? (
                          <Link
                            href={target(notification) as string}
                            onClick={() => {
                              if (!notification.readAt) mark.mutate(notification.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#EA6800]"
                          >
                            Abrir
                          </Link>
                        ) : null}
                        {!notification.readAt ? (
                          <button
                            onClick={() => mark.mutate(notification.id)}
                            className="rounded-xl px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            Marcar como lida
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            if (window.confirm("Excluir esta notificação?")) remove.mutate(notification.id);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="size-3.5" />
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PrivateShell>
  );
}
