"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import { profileSchema, type ProfileFormData } from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { formatPhone } from "@/features/auth/utils/formatters";
import { updateProfile } from "@/services/auth/auth-service";
import { updatePassword } from "@/services/auth/auth-service";
import type { Profile } from "@/types/auth";
import { useAuth } from "@/hooks/use-auth";

export function ProfileForm({ profile }: { profile: Profile }) {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
  const onPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setPasswordMessage(null); setPasswordError(null);
    if (password.length < 8) return setPasswordError("A senha deve ter pelo menos 8 caracteres.");
    if (password !== confirmPassword) return setPasswordError("As senhas não coincidem.");
    const { error } = await updatePassword(password);
    if (error) return setPasswordError(getFriendlyAuthError(error.message));
    setPassword(""); setConfirmPassword(""); setPasswordMessage("Senha alterada com sucesso.");
  };

  return (
    <>
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
      <form onSubmit={onPasswordSubmit} className="mt-8 space-y-4 border-t border-[#111827]/10 pt-8">
        <div><h2 className="text-xl font-black">Segurança da conta</h2><p className="mt-1 text-sm text-black/55">Altere sua senha sempre que precisar.</p></div>
        {passwordMessage ? <FormMessage success>{passwordMessage}</FormMessage> : null}
        {passwordError ? <FormMessage>{passwordError}</FormMessage> : null}
        <FormField id="new-password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <FormField id="confirm-password" label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
        <SubmitButton loading={false}>Alterar senha</SubmitButton>
      </form>
      {user?.accountType === "business" ? <div className="mt-8 rounded-2xl bg-[#FFF7ED] p-5"><h2 className="font-black">Plano da empresa</h2><p className="mt-1 text-sm text-black/60">Consulte recursos, uso diário e faça upgrade quando quiser.</p><a href="/empresa/plano" className="mt-4 inline-flex rounded-xl bg-[#F97316] px-4 py-3 text-sm font-black text-white">Ver meu plano</a></div> : null}
    </>
  );
}
