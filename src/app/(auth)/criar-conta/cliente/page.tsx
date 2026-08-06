import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { CustomerSignUpForm } from "@/features/auth/components/customer-sign-up-form";
export const metadata: Metadata = {
  title: "Cadastro de cliente | CotaMap",
  robots: { index: false, follow: false },
};
export default function CustomerSignUpPage() {
  return (
    <AuthShell
      title="Criar conta de cliente"
      description="Preencha seus dados para começar a solicitar cotações."
    >
      <CustomerSignUpForm />
    </AuthShell>
  );
}
