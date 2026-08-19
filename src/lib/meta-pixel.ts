export const META_PIXEL_ID = "27922117597444470";

type MetaEventParameters = Record<string, string | number | boolean>;
type MetaPixelFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
    __metaPixelInitialized?: boolean;
  }
}

function ensureMetaPixel(): MetaPixelFunction | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue?.push(args);
    }) as MetaPixelFunction;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;
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
  const fbq = window.fbq;
  if (!fbq) return null;
  if (!window.__metaPixelInitialized) {
    fbq("init", META_PIXEL_ID);
    window.__metaPixelInitialized = true;
  }
  return fbq;
}

export function initializeMetaPixel(): void {
  ensureMetaPixel();
}

export function trackMetaEvent(event: string, parameters?: MetaEventParameters): void {
  const fbq = ensureMetaPixel();
  if (!fbq) return;
  try { fbq("track", event, parameters ?? {}); } catch { /* bloqueadores não devem afetar o usuário */ }
}

export function trackMetaCustomEvent(event: string, parameters?: MetaEventParameters): void {
  const fbq = ensureMetaPixel();
  if (!fbq) return;
  try { fbq("trackCustom", event, parameters ?? {}); } catch { /* bloqueadores não devem afetar o usuário */ }
}
