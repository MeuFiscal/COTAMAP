import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { VerifyEmailPanel } from "@/features/auth/components/verify-email-panel";
export const metadata: Metadata = {
  title: "Verifique seu e-mail | CotaMap",
  robots: { index: false, follow: false },
};
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return (
    <AuthShell
      title="Confirme seu cadastro"
      description="Falta apenas validar seu endereço de e-mail."
    >
      <VerifyEmailPanel email={email} />
    </AuthShell>
  );
}
