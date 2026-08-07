import { MapPin } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/features/auth/components/logout-button";

export function PrivateShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#F3F4F6]">
      <header className="border-b border-[#111827]/5 bg-[#FFFFFF]">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 font-black tracking-[-0.04em]">
            <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-[#FFFFFF]">
              <MapPin className="size-5" />
            </span>
            <span className="text-xl">
              Cota<span className="text-[#F97316]">Map</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/perfil"
              className="rounded-xl px-3 py-2 text-sm font-bold hover:text-[#F97316]"
            >
              Perfil
            </Link>
            <Link href="/notificacoes" aria-label="Notificações" className="rounded-xl px-3 py-2 text-sm font-bold hover:text-[#F97316]">🔔</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}
