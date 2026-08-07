import { MapPin } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      href="#inicio"
      className="inline-flex items-center gap-2 rounded-lg font-black tracking-[-0.04em]"
      aria-label="CotaMap — início"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-[#F97316] text-[#FFFFFF] shadow-[0_8px_24px_rgba(17,24,39,0.12)]">
        <MapPin aria-hidden="true" className="size-5" strokeWidth={2.5} />
      </span>
      <span className={`text-xl ${light ? "text-white" : "text-[#111827]"}`}>
        Cota<span className="text-[#F97316]">Map</span>
      </span>
    </a>
  );
}
