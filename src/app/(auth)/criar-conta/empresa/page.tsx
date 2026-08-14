import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { BusinessSignUpForm } from "@/features/auth/components/business-sign-up-form";
export const metadata: Metadata = {
  title: "Cadastro de empresa | CotaMap",
  robots: { index: false, follow: false },
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BusinessSignUpPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const requestedPlan = (await searchParams).plan;
  const planId = requestedPlan && UUID_PATTERN.test(requestedPlan) ? requestedPlan : undefined;
  return (
    <AuthShell
      wide
      title="Cadastrar minha autopeça"
      description="Só o essencial agora. O restante será concluído após o primeiro acesso."
    >
      <BusinessSignUpForm planId={planId} />
    </AuthShell>
  );
}
