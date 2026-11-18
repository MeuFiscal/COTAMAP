import { ProfilePageContent } from "@/features/auth/components/profile-page-content";
import { requireProfile } from "@/features/auth/server/guards";
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ context?: string }> }) {
  const profile = await requireProfile();
  const { context } = await searchParams;
  return <ProfilePageContent profile={profile} businessContextRequested={context === "business"} />;
}
