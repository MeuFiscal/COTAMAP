"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { useAuth } from "@/hooks/use-auth";

export function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() =>
        void logout().then(() => {
          router.replace(AUTH_ROUTES.login);
          router.refresh();
        })
      }
      className="inline-flex items-center gap-2 rounded-xl border border-[#111827]/10 px-4 py-2 text-sm font-bold transition hover:border-[#F97316] hover:text-[#F97316]"
    >
      <LogOut className="size-4" />
      Sair
    </button>
  );
}
