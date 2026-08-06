import { Building2, UserRound } from "lucide-react";
import Link from "next/link";

import { AUTH_ROUTES } from "@/constants/auth";

const options = [
  {
    href: AUTH_ROUTES.customerSignUp,
    icon: UserRound,
    title: "Sou cliente",
    description: "Quero solicitar e comparar cotações de autopeças.",
  },
  {
    href: AUTH_ROUTES.businessSignUp,
    icon: Building2,
    title: "Sou uma empresa",
    description: "Quero receber pedidos e enviar cotações aos clientes.",
  },
] as const;

export function AccountTypeSelector() {
  return (
    <div className="space-y-4">
      {options.map(({ href, icon: Icon, title, description }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-4 rounded-2xl border border-[#111827]/10 p-5 transition hover:-translate-y-0.5 hover:border-[#F97316] hover:shadow-[0_16px_36px_rgba(17,24,39,0.08)]"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#F3F4F6] text-[#F97316] transition group-hover:bg-[#F97316] group-hover:text-[#FFFFFF]">
            <Icon className="size-6" />
          </span>
          <span>
            <strong className="block text-base text-[#111827]">{title}</strong>
            <span className="mt-1 block text-sm leading-5 text-[#111827]/55">{description}</span>
          </span>
        </Link>
      ))}
      <p className="pt-2 text-center text-sm text-[#111827]/60">
        Já possui conta?{" "}
        <Link href={AUTH_ROUTES.login} className="font-black text-[#F97316] hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
