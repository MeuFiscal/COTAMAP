import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/constants/auth";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { requireProfile } from "@/features/auth/server/guards";
export default async function AdminPlaceholderPage() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect(AUTH_ROUTES.accessDenied);
  return (
    <PrivateShell>
      <section className="rounded-[2rem] bg-[#FFFFFF] p-10 shadow-sm">
        <ShieldCheck className="size-12 text-[#F97316]" />
        <h1 className="mt-5 text-3xl font-black">Área administrativa</h1>
        <p className="mt-3 text-[#111827]/60">
          Acesso administrativo validado. O painel será implementado em uma etapa futura.
        </p>
      </section>
    </PrivateShell>
  );
}
