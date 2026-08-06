import { Building2, CheckCircle2 } from "lucide-react";
import { PrivateShell } from "@/features/auth/components/private-shell";
import { requireUser } from "@/features/auth/server/guards";
export default async function CompleteRegistrationPage() {
  const { user } = await requireUser();
  const name =
    typeof user.user_metadata.business_name === "string"
      ? user.user_metadata.business_name
      : "sua empresa";
  return (
    <PrivateShell>
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-[#FFFFFF] p-7 shadow-sm sm:p-10">
        <Building2 className="size-12 text-[#F97316]" />
        <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">
          Complete o cadastro de {name}
        </h1>
        <p className="mt-3 text-[#111827]/60">
          Sua conta foi autenticada. O preenchimento dos dados empresariais será disponibilizado na
          etapa dedicada à empresa.
        </p>
        <div className="mt-8 flex gap-3 rounded-2xl bg-[#F3F4F6] p-5">
          <CheckCircle2 className="size-6 shrink-0 text-[#F97316]" />
          <p className="text-sm leading-6">
            <strong className="block">Cadastro inicial concluído</strong>Nenhum registro empresarial
            foi criado automaticamente nesta etapa.
          </p>
        </div>
      </section>
    </PrivateShell>
  );
}
