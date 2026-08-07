export type QuoteSort = "price" | "distance" | "rating" | "pickup";
export type QuoteAvailability = "Pronta" | "Separando" | "Sob encomenda";
export type QuotesViewState = "list" | "loading" | "empty" | "error";

export type QuoteComparison = {
  id: string;
  businessName: string;
  businessInitials: string;
  rating: number;
  reviewCount: number;
  cotamapScore: number;
  price: number;
  brand: string;
  note: string;
  description: string;
  distanceKm: number;
  pickupMinutes: number;
  pickupLabel: string;
  responseMinutes: number;
  status: QuoteAvailability;
  address: string;
  openingHours: string;
  paymentMethods: readonly string[];
  imagePosition?: string;
};
