import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { BusinessSignUpForm } from "@/features/auth/components/business-sign-up-form";
export const metadata: Metadata = {
  title: "Cadastro de empresa | CotaMap",
  robots: { index: false, follow: false },
};
export default function BusinessSignUpPage() {
  return (
    <AuthShell
      wide
      title="Cadastrar minha autopeça"
      description="Só o essencial agora. O restante será concluído após o primeiro acesso."
    >
      <BusinessSignUpForm />
    </AuthShell>
  );
}
