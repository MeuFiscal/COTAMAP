"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

type FormFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: string;
  error?: string;
  hint?: string;
};

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { id, label, error, hint, type = "text", className = "", ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;
  const helpId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold text-[#111827]">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={resolvedType}
          aria-invalid={Boolean(error)}
          aria-describedby={helpId}
          className={`min-h-12 w-full rounded-xl border bg-[#FFFFFF] px-4 text-base text-[#111827] transition placeholder:text-[#111827]/35 focus:border-[#F97316] focus:outline-none ${
            error ? "border-[#F97316]" : "border-[#111827]/15"
          } ${isPassword ? "pr-12" : ""} ${className}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-[#111827]/55 transition hover:text-[#F97316]"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-semibold text-[#C2410C]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#111827]/55">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
