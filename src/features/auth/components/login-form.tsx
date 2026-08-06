"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AUTH_ROUTES } from "@/constants/auth";
import { FormField } from "@/features/auth/components/form-field";
import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError, getSafeNextPath } from "@/features/auth/utils/errors";
import { getPostLoginPath, signIn } from "@/services/auth/auth-service";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setSubmitError(null);
    const { data, error } = await signIn(email, password);

    if (error || !data.user) {
      setSubmitError(getFriendlyAuthError(error?.message ?? "Falha no login"));
      return;
    }

    const requestedPath = searchParams.get("next");
    const destination = requestedPath
      ? getSafeNextPath(requestedPath)
      : await getPostLoginPath(data.user);
    router.replace(destination);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <FormField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@email.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-[#111827]/65">
          <input type="checkbox" className="size-4 accent-[#F97316]" {...register("remember")} />
          Lembrar acesso
        </label>
        <Link
          href={AUTH_ROUTES.forgotPassword}
          className="font-bold text-[#F97316] hover:underline"
        >
          Esqueci minha senha
        </Link>
      </div>
      <SubmitButton loading={isSubmitting}>Entrar</SubmitButton>
      <p className="text-center text-sm text-[#111827]/60">
        Ainda não tem uma conta?{" "}
        <Link href={AUTH_ROUTES.signUp} className="font-black text-[#F97316] hover:underline">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
