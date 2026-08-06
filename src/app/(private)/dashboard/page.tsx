import { Clock3, FileText } from "lucide-react";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/constants/auth";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { requireProfile, requireUser } from "@/features/auth/server/guards";

export default async function DashboardPlaceholderPage() {
  const { user } = await requireUser();
  if (user.user_metadata.account_type === "business") redirect(AUTH_ROUTES.completeRegistration);
  const profile = await requireProfile();
  if (profile.role === "admin") redirect(AUTH_ROUTES.admin);
  return (
    <PrivateShell>
      <section className="rounded-[2rem] bg-[#FFFFFF] p-7 shadow-sm sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#F97316]/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#F97316]">
          <Clock3 className="size-4" />
          Em preparação
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">
          Olá, {profile.full_name.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-xl text-[#111827]/60">
          Seu acesso está funcionando. O dashboard do cliente será desenvolvido em uma próxima
          etapa.
        </p>
        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#F3F4F6] p-5">
          <FileText className="size-6 text-[#F97316]" />
          <span className="text-sm font-bold">
            Nenhuma funcionalidade de cotação foi implementada.
          </span>
        </div>
      </section>
    </PrivateShell>
  );
}
