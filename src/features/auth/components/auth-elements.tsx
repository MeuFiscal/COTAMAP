import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children: ReactNode;
};

export function SubmitButton({ loading = false, children, disabled, ...props }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 text-sm font-black text-[#FFFFFF] shadow-[0_10px_24px_rgba(249,115,22,0.2)] transition hover:-translate-y-0.5 hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
      {...props}
    >
      {loading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {loading ? "Aguarde..." : children}
    </button>
  );
}

export function FormMessage({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return (
    <div
      role={success ? "status" : "alert"}
      className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
        success
          ? "border-[#111827]/10 bg-[#F3F4F6] text-[#111827]"
          : "border-[#F97316]/25 bg-[#F97316]/10 text-[#9A3412]"
      }`}
    >
      {children}
    </div>
  );
}

export function AuthFooterLink({
  prompt,
  href,
  label,
}: {
  prompt: string;
  href: string;
  label: string;
}) {
  return (
    <p className="mt-6 text-center text-sm text-[#111827]/60">
      {prompt}{" "}
      <Link href={href} className="font-black text-[#F97316] hover:underline">
        {label}
      </Link>
    </p>
  );
}

export function TermsField({
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-[#111827]/65">
        <input
          type="checkbox"
          className="mt-0.5 size-4 rounded border-[#111827]/20 accent-[#F97316]"
          aria-invalid={Boolean(error)}
          {...props}
        />
        <span>
          Li e aceito os{" "}
          <Link className="font-bold text-[#111827] underline" href="/#termos">
            termos de uso
          </Link>{" "}
          e a política de privacidade.
        </span>
      </label>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-[#C2410C]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
