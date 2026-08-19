export const META_PIXEL_ID = "27922117597444470";

type MetaEventParameters = Record<string, string | number | boolean>;
type MetaPixelFunction = ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: (...args: unknown[]) => void };

declare global {
  interface Window {
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

export function trackMetaEvent(event: string, parameters?: MetaEventParameters): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, parameters ?? {});
}

export function trackMetaCustomEvent(event: string, parameters?: MetaEventParameters): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", event, parameters ?? {});
}
