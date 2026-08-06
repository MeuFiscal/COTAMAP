import type { QuoteRadius } from "@/features/quotes/types/new-quote";

export type SearchPhase = "locating" | "sending" | "waiting" | "receiving";

export type QuoteRequestPreview = {
  partName: string;
  vehicle: string;
  radius: QuoteRadius;
  photoUrl: string | null;
};

export type BusinessProgress = {
  id: string;
  name: string;
  status: string;
};
