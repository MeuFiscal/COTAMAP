"use client";

import { MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AUTH_ROUTES } from "@/constants/auth";
import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { resendConfirmation } from "@/services/auth/auth-service";

export function VerifyEmailPanel({ email }: { email?: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const result = await resendConfirmation(email);
    setLoading(false);
    if (result.error) return setError(getFriendlyAuthError(result.error.message));
    setMessage("Um novo e-mail de verificação foi enviado.");
  }

  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
        <MailCheck className="size-8" />
      </div>
      <h2 className="mt-5 text-xl font-black">Verifique sua caixa de entrada</h2>
      <p className="mt-2 text-sm leading-6 text-[#111827]/60">
        Enviamos um link de confirmação
        {email ? (
          <>
            {" "}
            para <strong className="text-[#111827]">{email}</strong>
          </>
        ) : null}
        . Ele confirma que o endereço pertence a você.
      </p>
      <div className="mt-6 space-y-4">
        {message ? <FormMessage success>{message}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}
        {email ? (
          <SubmitButton type="button" loading={loading} onClick={resend}>
            Reenviar e-mail
          </SubmitButton>
        ) : null}
        <Link
          href={AUTH_ROUTES.login}
          className="inline-block text-sm font-black text-[#F97316] hover:underline"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
