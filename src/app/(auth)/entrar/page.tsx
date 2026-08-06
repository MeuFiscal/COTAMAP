import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Entrar | CotaMap",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Bem-vindo de volta"
      description="Entre para acompanhar suas cotações e sua conta."
    >
      <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-[#F3F4F6]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
