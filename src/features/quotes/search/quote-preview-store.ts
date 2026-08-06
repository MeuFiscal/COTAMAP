import type { NewQuoteFormData } from "@/features/quotes/types/new-quote";
import type { QuoteRequestPreview } from "@/features/quotes/search/search-types";

let currentPreview: QuoteRequestPreview | null = null;

export function saveQuotePreview(values: NewQuoteFormData, photo: File | null): void {
  if (currentPreview?.photoUrl) URL.revokeObjectURL(currentPreview.photoUrl);

  const vehicle = [values.vehicleModel, values.vehicleYear, values.vehicleEngine]
    .filter(Boolean)
    .join(" · ");

  currentPreview = {
    partName: values.partName,
    vehicle: vehicle || "Veículo não informado",
    radius: values.radius,
    photoUrl: photo ? URL.createObjectURL(photo) : null,
  };
}

export function getQuotePreview(): QuoteRequestPreview | null {
  return currentPreview;
}
