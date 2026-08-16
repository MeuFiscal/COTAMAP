type BusinessLogoProps = { src?: string | null; name?: string | null; className?: string };

export function BusinessLogo({ src, name, className = "size-12" }: BusinessLogoProps) {
  const initials = (name ?? "Empresa").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "E";
  return src
    ? <img src={src} alt={`Logo de ${name ?? "empresa"}`} className={`${className} rounded-2xl object-cover`} loading="lazy" />
    : <span aria-label={`Logo de ${name ?? "empresa"}`} className={`${className} grid shrink-0 place-items-center rounded-2xl bg-orange-100 font-black text-orange-600`}>{initials}</span>;
}
