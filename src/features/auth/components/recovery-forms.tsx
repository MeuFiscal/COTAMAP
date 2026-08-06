"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AUTH_ROUTES } from "@/constants/auth";
import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormData,
  type ResetPasswordFormData,
} from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { requestPasswordReset, updatePassword } from "@/services/auth/auth-service";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });
  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitError(null);
    const { error } = await requestPasswordReset(email);
    if (error) return setSubmitError(getFriendlyAuthError(error.message));
    setSent(true);
  });

  if (sent)
    return (
      <StatusPanel
        icon={<MailCheck className="size-8" />}
        title="Confira seu e-mail"
        text="Se existir uma conta com esse endereço, você receberá um link seguro para redefinir a senha."
      />
    );

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <FormField
        id="email"
        label="E-mail da conta"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <SubmitButton loading={isSubmitting}>Enviar link de recuperação</SubmitButton>
      <BackToLogin />
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const onSubmit = handleSubmit(async ({ password }) => {
    setSubmitError(null);
    const { error } = await updatePassword(password);
    if (error) return setSubmitError(getFriendlyAuthError(error.message));
    router.replace(`${AUTH_ROUTES.login}?password=updated`);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <FormField
        id="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="8+ caracteres, com maiúscula, minúscula, número e símbolo."
        error={errors.password?.message}
        {...register("password")}
      />
      <FormField
        id="confirmPassword"
        label="Confirmar nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <SubmitButton loading={isSubmitting}>Salvar nova senha</SubmitButton>
    </form>
  );
}

function BackToLogin() {
  return (
    <p className="text-center text-sm">
      <Link href={AUTH_ROUTES.login} className="font-bold text-[#F97316] hover:underline">
        Voltar para o login
      </Link>
    </p>
  );
}

function StatusPanel({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
        {icon}
      </div>
      <h2 className="mt-5 text-xl font-black text-[#111827]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#111827]/60">{text}</p>
      <div className="mt-6">
        <BackToLogin />
      </div>
    </div>
  );
}

export function PasswordUpdatedMessage() {
  return (
    <FormMessage success>
      <span className="flex items-center gap-2">
        <CheckCircle2 className="size-4" />
        Senha atualizada. Entre com sua nova senha.
      </span>
    </FormMessage>
  );
}
