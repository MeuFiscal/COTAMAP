import { PrivateShell } from "@/features/auth/components/private-shell";
import { ProfileForm } from "@/features/auth/components/profile-form";
import { requireProfile } from "@/features/auth/server/guards";
export default async function ProfilePage() {
  const profile = await requireProfile();
  return (
    <PrivateShell>
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-[#FFFFFF] p-7 shadow-sm sm:p-10">
        <h1 className="text-3xl font-black tracking-[-0.04em]">Meu perfil</h1>
        <p className="mb-8 mt-2 text-sm text-[#111827]/60">
          Mantenha seus dados pessoais atualizados.
        </p>
        <ProfileForm profile={profile} />
      </section>
    </PrivateShell>
  );
}
