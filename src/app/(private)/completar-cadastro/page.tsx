import { Building2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
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
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-black/45">
            <span>Progresso</span><span>1 de 6 etapas</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#F3F4F6]"><div className="h-full w-1/6 rounded-full bg-[#F97316]" /></div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-bold text-black/55 sm:grid-cols-3">
            {["Dados", "Endereço", "Localização", "Horário", "Categoria", "Finalizar"].map((step, index) => <span key={step} className={index === 0 ? "text-[#F97316]" : ""}>{index + 1}. {step}</span>)}
          </div>
          <Link href="/empresa/configuracoes/localizacao" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#F97316] px-5 py-4 text-center font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ea580c]">
            Completar cadastro
          </Link>
        </div>
      </section>
    </PrivateShell>
  );
}
