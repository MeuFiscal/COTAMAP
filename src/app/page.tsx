import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { PremiumLanding } from "@/components/landing/premium-landing";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Header />
      <main><PremiumLanding /></main>
      <Footer />
    </>
  );
}
