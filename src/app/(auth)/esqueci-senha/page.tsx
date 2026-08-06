import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/recovery-forms";
export const metadata: Metadata = {
  title: "Recuperar senha | CotaMap",
  robots: { index: false, follow: false },
};
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      description="Informe seu e-mail e enviaremos um link seguro."
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
