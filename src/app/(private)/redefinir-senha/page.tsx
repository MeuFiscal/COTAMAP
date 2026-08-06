import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/recovery-forms";
export const metadata: Metadata = {
  title: "Redefinir senha | CotaMap",
  robots: { index: false, follow: false },
};
export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Crie uma nova senha"
      description="Escolha uma senha forte e diferente da anterior."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
