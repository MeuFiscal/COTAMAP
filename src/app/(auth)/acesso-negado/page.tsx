import { ShieldX } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/features/auth/components/auth-shell";
export default function AccessDeniedPage() {
  return (
    <AuthShell
      title="Acesso negado"
      description="Sua conta não possui permissão para acessar esta área."
    >
      <div className="text-center">
        <ShieldX className="mx-auto size-14 text-[#F97316]" />
        <p className="mt-5 text-sm text-[#111827]/60">
          Se você acredita que isso é um engano, fale com o administrador da sua empresa.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#111827] px-6 text-sm font-black text-[#FFFFFF] hover:bg-[#F97316]"
        >
          Voltar para o início
        </Link>
      </div>
    </AuthShell>
  );
}
