import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type ButtonLinkProps = Readonly<{
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
  className?: string;
}>;

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const styles =
    variant === "primary"
      ? "bg-[#F97316] text-[#FFFFFF] shadow-[0_12px_32px_rgba(249,115,22,0.24)] hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(249,115,22,0.30)]"
      : "border border-[#111827]/15 bg-[#FFFFFF] text-[#111827] hover:-translate-y-0.5 hover:border-[#F97316]";

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-center text-sm font-extrabold transition duration-200 ${styles} ${className}`}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </a>
  );
}
