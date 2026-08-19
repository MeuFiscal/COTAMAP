"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { META_PIXEL_ID } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.fbq) {
      const fbq = ((...args: unknown[]) => {
        fbq.queue = fbq.queue ?? [];
        fbq.queue.push(args);
      }) as NonNullable<Window["fbq"]>;
      fbq.loaded = true;
      fbq.version = "2.0";
      window.fbq = fbq;
      window._fbq = fbq;
      if (!document.querySelector('script[data-meta-pixel="true"]')) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        script.dataset.metaPixel = "true";
        document.head.appendChild(script);
      }
    }
    if (!initialized.current) {
      window.fbq("init", META_PIXEL_ID);
      initialized.current = true;
    }
    if (lastPage.current !== pathname) {
      window.fbq("track", "PageView");
      lastPage.current = pathname;
    }
  }, [pathname]);

  return null;
}
