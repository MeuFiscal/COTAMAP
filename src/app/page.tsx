import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { PremiumLanding } from "@/components/landing/premium-landing";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("saas_plans").select("code,name,price,daily_quote_limit").eq("is_active", true).order("price", { ascending: true });
  const plans = (data ?? []).map((plan) => ({ code: plan.code, name: plan.name, price: Number(plan.price), dailyLimit: plan.daily_quote_limit }));
  const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url, description: siteConfig.description };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><Header /><main><PremiumLanding plans={plans} /></main><Footer /></>;
}
