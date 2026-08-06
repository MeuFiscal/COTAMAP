import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
};

export function PrimaryButton({
  children,
  loading = false,
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-6 text-sm font-black uppercase tracking-[0.08em] text-[#FFFFFF] shadow-[0_14px_30px_rgba(249,115,22,0.22)] transition hover:-translate-y-0.5 hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-64"
      {...props}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : null}
      {loading ? "Solicitando..." : children}
    </button>
  );
}
