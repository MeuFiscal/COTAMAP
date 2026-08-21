import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { PremiumLanding } from "@/components/landing/premium-landing";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: planRows } = await supabase.from("saas_plans").select("id,code,name,description,price,promotional_price,promotion_starts_at,promotion_ends_at,daily_quote_limit,is_unlimited,benefits,provider,provider_product_id,provider_offer_id,provider_checkout_id,provider_checkout_url,sort_order,created_at").eq("is_active", true).eq("is_public", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
  const plans = (planRows ?? []).map((plan) => ({ id: plan.id, code: plan.code, name: plan.name, description: plan.description, price: Number(plan.price), promotionalPrice: plan.promotional_price === null ? null : Number(plan.promotional_price), promotionStartsAt: plan.promotion_starts_at, promotionEndsAt: plan.promotion_ends_at, dailyLimit: plan.daily_quote_limit, unlimited: plan.is_unlimited, benefits: Array.isArray(plan.benefits) ? plan.benefits : [], provider: plan.provider, providerProductId: plan.provider_product_id, providerOfferId: plan.provider_offer_id, providerCheckoutId: plan.provider_checkout_id, checkoutUrl: plan.provider_checkout_url, sortOrder: plan.sort_order, createdAt: plan.created_at }));
  const organizationSchema = { "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url, description: siteConfig.description };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} /><Header /><main><PremiumLanding plans={plans} /></main><Footer /></>;
}
