"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { initializeMetaPixel, trackMetaEvent } from "@/lib/meta-pixel";

export function MetaPixel() {
  const pathname = usePathname();
  const initialized = useRef(false);
  const lastPage = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    initializeMetaPixel();
    if (!initialized.current) initialized.current = true;
    if (lastPage.current !== pathname) {
      trackMetaEvent("PageView");
      lastPage.current = pathname;
    }
  }, [pathname]);

  return null;
}
