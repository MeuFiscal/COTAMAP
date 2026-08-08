"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { AUTH_ROUTES } from "@/constants/auth";
import { AccountCreatedMessage } from "@/features/auth/components/account-created-message";
import { LocationMap } from "@/features/auth/components/location-map";
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
import { getPostLoginPath, signUpBusiness } from "@/services/auth/auth-service";

export function BusinessSignUpForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
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
      addressLine: "",
      neighborhood: "",
      city: "",
      state: "",
      latitude: null,
      longitude: null,
      locationAccuracy: null,
      locationCapturedAt: null,
    },
  });

  const [locationDraft, setLocationDraft] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const reverseGeocode = async (latitude: number, longitude: number, replaceExisting = false) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`);
      if (!response.ok) return;
      const result = await response.json() as { address?: Record<string, string> };
      const address = result.address ?? {};
      const currentPostalCode = getValues("postalCode");
      const detectedPostalCode = address.postcode ?? "";
      if (!currentPostalCode || replaceExisting || window.confirm("Encontramos uma localização pelo GPS. Deseja substituir o endereço informado?")) {
        setValue("postalCode", detectedPostalCode, { shouldValidate: true });
        setValue("addressLine", address.road ?? address.pedestrian ?? "");
        setValue("neighborhood", address.suburb ?? "");
        setValue("city", address.city ?? address.town ?? address.village ?? "");
        setValue("state", address.state ?? "");
      }
    } catch { /* endereço continua editável manualmente */ }
  };

  const captureLocation = () => {
    setLocationMessage(null);
    if (!navigator.geolocation) { setLocationMessage("Você pode preencher o endereço manualmente."); return; }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const draft = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy };
      setLocationDraft(draft);
      await reverseGeocode(draft.latitude, draft.longitude);
      setLocationMessage("✔ Localização encontrada. Confira o ponto e confirme para salvar.");
      setLocationLoading(false);
    }, (error) => { setLocationLoading(false); setLocationMessage(error.code === error.PERMISSION_DENIED ? "Você pode preencher o endereço manualmente." : "❌ Não foi possível localizar sua empresa."); }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
  };

  const confirmLocation = () => {
    if (!locationDraft) return;
    setValue("latitude", locationDraft.latitude);
    setValue("longitude", locationDraft.longitude);
    setValue("locationAccuracy", locationDraft.accuracy);
    setValue("locationCapturedAt", new Date().toISOString());
    setLocationConfirmed(true);
    setLocationMessage("✔ Localização confirmada e pronta para o cadastro.");
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    const { data, error } = await signUpBusiness(values);
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

  if (created) return <AccountCreatedMessage />;

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
      <section className="rounded-3xl border border-[#F97316]/20 bg-[#FFF7ED] p-5 sm:p-6" aria-labelledby="location-title">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#F97316] text-xl text-white">📍</span><div><h2 id="location-title" className="text-xl font-black">Localização da loja</h2><p className="mt-1 text-sm leading-6 text-black/60">A localização será utilizada apenas para conectar clientes próximos da sua loja.</p></div></div>
        <button type="button" onClick={captureLocation} disabled={locationLoading} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#F97316] px-5 py-4 font-black text-white shadow-lg shadow-orange-500/20 disabled:opacity-60">{locationLoading ? "Localizando sua loja..." : "📍 Usar minha localização atual"}</button>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><FormField id="addressLine" label="Rua" placeholder="Preenchida pelo GPS ou manualmente" {...register("addressLine")} /><FormField id="neighborhood" label="Bairro" {...register("neighborhood")} /><FormField id="city" label="Cidade" {...register("city")} /><FormField id="state" label="Estado" {...register("state")} /></div>
        {locationDraft ? <div className="mt-5"><LocationMap latitude={locationDraft.latitude} longitude={locationDraft.longitude} onChange={(latitude, longitude) => { setLocationDraft((current) => current ? { ...current, latitude, longitude } : current); setLocationConfirmed(false); setLocationMessage("Atualizando o endereço do ponto selecionado..."); void reverseGeocode(latitude, longitude, true).then(() => setLocationMessage("✔ Endereço atualizado. Confirme a localização para salvar.")); }} /><div className="mt-3 grid gap-2 text-sm font-semibold text-black/65 sm:grid-cols-3"><span>Latitude: {locationDraft.latitude.toFixed(6)}</span><span>Longitude: {locationDraft.longitude.toFixed(6)}</span><span>Precisão: {Math.round(locationDraft.accuracy)} m</span></div></div> : null}
        {locationDraft && !locationConfirmed ? <button type="button" onClick={confirmLocation} className="mt-4 w-full rounded-2xl border-2 border-[#F97316] bg-white px-5 py-3.5 font-black text-[#C2410C]">Confirmar localização</button> : null}
        {locationMessage ? <p role="status" className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-black/70">{locationMessage}</p> : null}
      </section>
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
