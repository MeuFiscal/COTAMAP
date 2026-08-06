import type { Metadata } from "next";

import { AccountTypeSelector } from "@/features/auth/components/account-type-selector";
import { AuthShell } from "@/features/auth/components/auth-shell";

export const metadata: Metadata = {
  title: "Criar conta | CotaMap",
  robots: { index: false, follow: false },
};
export default function SignUpPage() {
  return (
    <AuthShell title="Quem é você?" description="Escolha como deseja usar o CotaMap.">
      <AccountTypeSelector />
    </AuthShell>
  );
}
