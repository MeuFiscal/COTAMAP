"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import { profileSchema, type ProfileFormData } from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { formatPhone } from "@/features/auth/utils/formatters";
import { updateProfile } from "@/services/auth/auth-service";
import type { Profile } from "@/types/auth";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile.full_name, phone: formatPhone(profile.phone ?? "") },
  });
  const onSubmit = handleSubmit(async ({ fullName, phone }) => {
    setMessage(null);
    setSubmitError(null);
    try {
      const { error } = await updateProfile(profile.id, fullName, phone);
      if (error) return setSubmitError(getFriendlyAuthError(error.message));
      setMessage("Perfil atualizado com sucesso.");
    } catch {
      setSubmitError("Não foi possível atualizar seu perfil.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {message ? <FormMessage success>{message}</FormMessage> : null}
      {submitError ? <FormMessage>{submitError}</FormMessage> : null}
      <FormField
        id="fullName"
        label="Nome"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />
      <FormField
        id="email"
        label="E-mail"
        type="email"
        value={profile.email}
        disabled
        hint="O e-mail é gerenciado pelo acesso da conta."
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
            value={field.value}
            onBlur={field.onBlur}
            onChange={(event) => field.onChange(formatPhone(event.target.value))}
            error={errors.phone?.message}
          />
        )}
      />
      <SubmitButton loading={isSubmitting}>Salvar alterações</SubmitButton>
    </form>
  );
}
