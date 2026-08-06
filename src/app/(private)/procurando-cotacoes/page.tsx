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
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return (
    <PrivateShell>
      <SearchQuotesExperience initialEmpty={state === "empty"} />
    </PrivateShell>
  );
}
