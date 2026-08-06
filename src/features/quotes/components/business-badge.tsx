import { ShieldCheck } from "lucide-react";

import { Rating } from "@/features/quotes/components/rating";

type BusinessBadgeProps = {
  name: string;
  initials: string;
  rating: number;
  reviews: number;
  score: number;
};

export function BusinessBadge({ name, initials, rating, reviews, score }: BusinessBadgeProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#111827] text-sm font-black text-[#FFFFFF]"
        aria-label={`Logo ${name}`}
      >
        {initials}
      </span>
      <div className="min-w-0">
        <h2 className="truncate text-base font-black text-[#111827]">{name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Rating value={rating} reviews={reviews} />
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#111827]/55">
            <ShieldCheck className="size-4 text-[#F97316]" aria-hidden="true" />
            Índice {score}
          </span>
        </div>
      </div>
    </div>
  );
}
