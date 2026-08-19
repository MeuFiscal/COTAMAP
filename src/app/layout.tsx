import type { Metadata } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { QueryProvider } from "@/providers/query-provider";
import { ServiceWorkerRegistration } from "@/features/pwa/components/service-worker-registration";
import { MetaPixel } from "@/components/analytics/meta-pixel";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/og.png",
        width: 1792,
        height: 1024,
        alt: "CotaMap — até 5 cotações em um único pedido",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/favicon.svg", shortcut: "/icon-192.svg", apple: "/icon-192.svg" },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body><MetaPixel /><ServiceWorkerRegistration /><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
