export const QUOTE_RADIUS_OPTIONS = [5, 10, 20, 50] as const;

export type QuoteRadius = (typeof QUOTE_RADIUS_OPTIONS)[number];

export type NewQuoteFormData = {
  partName: string;
  brand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleEngine: string;
  notes: string;
  radius: QuoteRadius;
};
