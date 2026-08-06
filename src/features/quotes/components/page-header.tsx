import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  backHref?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  backHref = "/dashboard",
}: PageHeaderProps) {
  return (
    <header className="mb-8 sm:mb-10">
      <Link
        href={backHref}
        className="mb-8 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-[#111827]/60 transition hover:text-[#F97316]"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Voltar
      </Link>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">{eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-[#111827] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#111827]/60">{description}</p>
    </header>
  );
}
