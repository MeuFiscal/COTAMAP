import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { SearchQuotesExperience } from "@/features/quotes/components/search-quotes-experience";

export const metadata: Metadata = {
  title: "Procurando cotações | CotaMap",
  robots: { index: false, follow: false },
};

export default async function SearchingQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  return (
    <PrivateShell>
      <SearchQuotesExperience requestId={request ?? null} />
    </PrivateShell>
  );
}
