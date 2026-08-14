import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Assinar plano | CotaMap",
  robots: { index: false, follow: false },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeCheckoutUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function Message({ title, description }: { title: string; description: string }) {
  return <AuthShell title={title} description={description}><Link href="/" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F97316] px-5 text-sm font-black text-white">Voltar para o início</Link></AuthShell>;
}

export default async function SubscribePage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const requestedPlan = (await searchParams).plan;
  if (!requestedPlan || !UUID_PATTERN.test(requestedPlan)) {
    return <Message title="Plano não encontrado" description="Escolha um dos planos disponíveis na página inicial." />;
  }

  const supabase = await createClient();
  const { data: identity } = await supabase.auth.getUser();
  if (!identity.user) redirect(`/criar-conta/empresa?plan=${encodeURIComponent(requestedPlan)}`);
  const { data: plan } = await supabase.from("saas_plans").select("id,price,promotional_price,provider_checkout_url").eq("id", requestedPlan).eq("is_active", true).eq("is_public", true).maybeSingle();

  if (!plan) return <Message title="Plano indisponível" description="Este plano não está disponível para assinatura no momento." />;
  if (identity.user.user_metadata.account_type !== "business") {
    return <Message title="Plano exclusivo para lojas" description="Os planos são exclusivos para lojas e autopeças. Sua conta de cliente continua gratuita." />;
  }

  const paid = Number(plan.price) > 0 || plan.promotional_price !== null;
  if (!paid) redirect("/empresa/operador");
  const checkoutUrl = safeCheckoutUrl(plan.provider_checkout_url);
  if (!checkoutUrl) return <Message title="Checkout indisponível" description="O checkout deste plano ainda não está disponível. Tente novamente mais tarde." />;
  redirect(checkoutUrl);
}
