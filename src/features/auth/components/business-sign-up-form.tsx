"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AUTH_ROUTES } from "@/constants/auth";
import {
  AuthFooterLink,
  FormMessage,
  SubmitButton,
  TermsField,
} from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import {
  businessSignUpSchema,
  type BusinessSignUpFormData,
} from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { formatPhone, formatPostalCode } from "@/features/auth/utils/formatters";
import { signUpBusiness } from "@/services/auth/auth-service";

export function BusinessSignUpForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusinessSignUpFormData>({
    resolver: zodResolver(businessSignUpSchema),
    defaultValues: {
      businessName: "",
      responsibleName: "",
      phone: "",
      whatsapp: "",
      postalCode: "",
      addressNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { error } = await signUpBusiness(values);
    if (error) return setSubmitError(getFriendlyAuthError(error.message));
    router.push(
      `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(values.email)}&type=business`,
    );
  });

  const masked = (name: "phone" | "whatsapp", label: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormField
          id={name}
          label={label}
          type="tel"
          inputMode="numeric"
          value={field.value}
          onBlur={field.onBlur}
          onChange={(event) => field.onChange(formatPhone(event.target.value))}
          error={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="businessName"
          label="Nome da empresa"
          autoComplete="organization"
          error={errors.businessName?.message}
          {...register("businessName")}
        />
        <FormField
          id="responsibleName"
          label="Nome do responsável"
          autoComplete="name"
          error={errors.responsibleName?.message}
          {...register("responsibleName")}
        />
        {masked("phone", "Telefone")}
        {masked("whatsapp", "WhatsApp")}
        <Controller
          name="postalCode"
          control={control}
          render={({ field }) => (
            <FormField
              id="postalCode"
              label="CEP"
              inputMode="numeric"
              autoComplete="postal-code"
              value={field.value}
              onBlur={field.onBlur}
              onChange={(event) => field.onChange(formatPostalCode(event.target.value))}
              error={errors.postalCode?.message}
            />
          )}
        />
        <FormField
          id="addressNumber"
          label="Número"
          inputMode="numeric"
          error={errors.addressNumber?.message}
          {...register("addressNumber")}
        />
      </div>
      <FormField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          hint="Use 8+ caracteres, número e símbolo."
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
      </div>
      <TermsField error={errors.terms?.message} {...register("terms")} />
      <SubmitButton loading={isSubmitting}>Cadastrar minha autopeça</SubmitButton>
      <AuthFooterLink prompt="Já possui conta?" href={AUTH_ROUTES.login} label="Entrar" />
    </form>
  );
}
