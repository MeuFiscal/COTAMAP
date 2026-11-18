"use client";

import { useEffect, useState } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { getSelectedBusinessMembership, type BusinessMembership } from "@/services/business/business-service";
import type { Profile } from "@/types/auth";

type ProfilePageContentProps = {
  profile: Profile;
  businessContextRequested: boolean;
};

export function ProfilePageContent({ profile, businessContextRequested }: ProfilePageContentProps) {
  return <ProfilePageContext key={`${profile.id}:${businessContextRequested ? "business" : "customer"}`} profile={profile} businessContextRequested={businessContextRequested} />;
}

function ProfilePageContext({ profile, businessContextRequested }: ProfilePageContentProps) {
  const [membership, setMembership] = useState<BusinessMembership | null | undefined>(businessContextRequested ? undefined : null);

  useEffect(() => {
    if (!businessContextRequested) return;

    let cancelled = false;
    void getSelectedBusinessMembership()
      .then((nextMembership) => {
        if (!cancelled) setMembership(nextMembership);
      })
      .catch(() => {
        if (!cancelled) setMembership(null);
      });

    return () => { cancelled = true; };
  }, [businessContextRequested]);

  if (membership === undefined) {
    return <main className="min-h-[100dvh] bg-[#F3F4F6]" aria-busy="true" />;
  }

  const businessRole = membership?.role ?? null;
  return (
    <PrivateShell businessRole={businessRole}>
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-[#FFFFFF] p-7 shadow-sm sm:p-10">
        <h1 className="text-3xl font-black tracking-[-0.04em]">Meu perfil</h1>
        <p className="mb-8 mt-2 text-sm text-[#111827]/60">
          Mantenha seus dados pessoais atualizados.
        </p>
        <ProfileForm profile={profile} isBusinessContext={Boolean(membership)} />
      </section>
    </PrivateShell>
  );
}
