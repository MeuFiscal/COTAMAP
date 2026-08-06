"use client";

import { forwardRef } from "react";

type QuoteFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  optional?: boolean;
};

export const QuoteField = forwardRef<HTMLInputElement, QuoteFieldProps>(function QuoteField(
  { id, label, error, optional = false, className = "", ...props },
  ref,
) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-black text-[#111827]">
          {label}
        </label>
        {optional ? <span className="text-xs text-[#111827]/40">Opcional</span> : null}
      </div>
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`min-h-14 w-full rounded-2xl border bg-[#FFFFFF] px-4 text-base text-[#111827] transition placeholder:text-[#111827]/30 focus:border-[#F97316] focus:outline-none ${error ? "border-[#F97316]" : "border-[#111827]/10"} ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-[#C2410C]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
