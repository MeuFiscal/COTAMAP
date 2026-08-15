import type { Metadata } from "next";

import { PrivateShell } from "@/features/auth/components/private-shell";
import { PageHeader } from "@/features/quotes/components/page-header";
import { QuoteForm } from "@/features/quotes/components/quote-form";

export const metadata: Metadata = {
  title: "Nova cotação | CotaMap",
  robots: { index: false, follow: false },
};

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  return (
    <PrivateShell>
      <div className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Nova cotação"
          title="Qual peça você precisa?"
          description="Conte o essencial. O CotaMap prepara sua solicitação para encontrar autopeças próximas."
        />
        <QuoteForm requestId={request ?? null} />
      </div>
    </PrivateShell>
  );
}
