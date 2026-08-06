import { Star } from "lucide-react";

export function Rating({ value, reviews }: { value: number; reviews?: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-sm font-black text-[#111827]"
      aria-label={`Avaliação ${value} de 5${reviews ? `, ${reviews} avaliações` : ""}`}
    >
      <Star className="size-4 fill-[#F97316] text-[#F97316]" aria-hidden="true" />
      {value.toFixed(1)}
      {reviews ? <span className="font-medium text-[#111827]/35">({reviews})</span> : null}
    </span>
  );
}
