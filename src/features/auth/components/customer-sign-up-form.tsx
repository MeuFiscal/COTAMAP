"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AUTH_ROUTES } from "@/constants/auth";
import { AccountCreatedMessage } from "@/features/auth/components/account-created-message";
import {
  AuthFooterLink,
  FormMessage,
  SubmitButton,
  TermsField,
} from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import {
  customerSignUpSchema,
  type CustomerSignUpFormData,
} from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { formatPhone } from "@/features/auth/utils/formatters";
import { getPostLoginPath, signUpCustomer } from "@/services/auth/auth-service";

export function CustomerSignUpForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerSignUpFormData>({
    resolver: zodResolver(customerSignUpSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { data, error } = await signUpCustomer(values);
    if (error || !data.user) {
      setSubmitError(getFriendlyAuthError(error?.message ?? "Falha ao criar conta"));
      return;
    }

    const destination = await getPostLoginPath(data.user);
    setCreated(true);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 1000));
    router.replace(destination);
    router.refresh();
  });

  if (created) return <AccountCreatedMessage />;

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <FormField
        id="fullName"
        label="Nome"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <FormField
            id="phone"
            label="Telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={field.value}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(formatPhone(event.target.value))}
            error={errors.phone?.message}
          />
        )}
      />
      <FormField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        id="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        hint="8+ caracteres, com maiúscula, minúscula, número e símbolo."
        error={errors.password?.message}
        {...register("password")}
      />
      <FormField
        id="confirmPassword"
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <TermsField error={errors.terms?.message} {...register("terms")} />
      <SubmitButton loading={isSubmitting}>Criar minha conta</SubmitButton>
      <AuthFooterLink prompt="Já possui conta?" href={AUTH_ROUTES.login} label="Entrar" />
    </form>
  );
}
