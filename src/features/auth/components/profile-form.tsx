"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { AvatarEditor } from "@/features/auth/components/avatar-editor";
import { FormMessage, SubmitButton } from "@/features/auth/components/auth-elements";
import { FormField } from "@/features/auth/components/form-field";
import { profileSchema, type ProfileFormData } from "@/features/auth/schemas/auth-schemas";
import { getFriendlyAuthError } from "@/features/auth/utils/errors";
import { formatPhone } from "@/features/auth/utils/formatters";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/services/auth/auth-service";
import { updatePassword } from "@/services/auth/auth-service";
import { getSignedAvatarUrl } from "@/services/auth/avatar-service";
import type { Profile } from "@/types/auth";

export function ProfileForm({ profile, isBusinessContext = false }: { profile: Profile; isBusinessContext?: boolean }) {
 const { session } = useAuth();
 const [message, setMessage] = useState<string | null>(null);
 const [submitError, setSubmitError] = useState<string | null>(null);
 const [password, setPassword] = useState("");
 const [confirmPassword, setConfirmPassword] = useState("");
 const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
 const [passwordError, setPasswordError] = useState<string | null>(null);
 const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
 const [signedAvatarUrl, setSignedAvatarUrl] = useState<string | null>(null);

 const avatarPath = session?.user.user_metadata?.avatar_path as string | undefined;
 const legacyAvatarUrl = session?.user.user_metadata?.avatar_url;
 const hasLegacyAvatar = typeof legacyAvatarUrl === "string" && /^https?:\/\//.test(legacyAvatarUrl);
 const initials = (profile.full_name || "Usuário").split(" ").filter(Boolean).slice(0, 2).map((name) => name[0]).join("").toUpperCase();

 // Carregar URL assinada quando houver avatar_path
 useEffect(() => {
 if (!avatarPath) {
 setSignedAvatarUrl(null);
 return;
 }
 let cancelled = false;
 void getSignedAvatarUrl(avatarPath).then((url) => {
 if (!cancelled) setSignedAvatarUrl(url);
 });
 return () => { cancelled = true; };
 }, [avatarPath]);

 const displayAvatarUrl = signedAvatarUrl ?? (hasLegacyAvatar ? legacyAvatarUrl : null);

 const handleAvatarUpdate = useCallback((newUrl: string | null) => {
 setSignedAvatarUrl(newUrl);
 }, []);

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
 event.preventDefault();
 setPasswordMessage(null);
 setPasswordError(null);
 if (password.length < 8) return setPasswordError("A senha deve ter pelo menos 8 caracteres.");
 if (password !== confirmPassword) return setPasswordError("As senhas não coincidem.");
 const { error } = await updatePassword(password);
 if (error) return setPasswordError(getFriendlyAuthError(error.message));
 setPassword("");
 setConfirmPassword("");
 setPasswordMessage("Senha alterada com sucesso.");
 };

 return (
 <>
 {/* Seção de Avatar */}
 <div className="mb-8 flex items-center gap-5">
 <button
 type="button"
 onClick={() => setAvatarEditorOpen(true)}
 className="group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-orange-200 bg-orange-50 text-3xl font-black text-[#F97316] transition hover:border-[#F97316] hover:shadow-[0_8px_24px_rgba(249,115,22,.2)]"
 style={displayAvatarUrl ? { backgroundImage: `url("${displayAvatarUrl}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
 >
 {displayAvatarUrl ? <span className="sr-only">{profile.full_name}</span> : initials}
 <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
 <Camera className="size-8 text-white" />
 </span>
 </button>
 <div>
 <h2 className="text-xl font-black text-slate-950">Foto de perfil</h2>
 <p className="mt-1 text-sm text-slate-500">
 Clique na foto para adicionar, alterar ou remover.
 </p>
 <button
 type="button"
 onClick={() => setAvatarEditorOpen(true)}
 className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#EA6800]"
 >
 <Camera className="size-4" />
 {displayAvatarUrl ? "Alterar foto" : "Adicionar foto"}
 </button>
 </div>
 </div>

 {/* Formulário de Dados */}
 <form onSubmit={onSubmit} className="space-y-5" noValidate>
 {message ? <FormMessage success>{message}</FormMessage> : null}
 {submitError ? <FormMessage>{submitError}</FormMessage> : null}
 <FormField id="fullName" label="Nome" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
 <FormField id="email" label="E-mail" type="email" value={profile.email} disabled hint="O e-mail é gerenciado pelo acesso da conta." />
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

 {/* Segurança */}
 <form onSubmit={onPasswordSubmit} className="mt-8 space-y-4 border-t border-[#111827]/10 pt-8">
 <div>
 <h2 className="text-xl font-black">Segurança da conta</h2>
 <p className="mt-1 text-sm text-black/55">Altere sua senha sempre que precisar.</p>
 </div>
 {passwordMessage ? <FormMessage success>{passwordMessage}</FormMessage> : null}
 {passwordError ? <FormMessage>{passwordError}</FormMessage> : null}
 <FormField id="new-password" label="Nova senha" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
 <FormField id="confirm-password" label="Confirmar nova senha" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
 <SubmitButton loading={false}>Alterar senha</SubmitButton>
 </form>

 {/* Plano Empresarial */}
 {isBusinessContext ? (
 <div className="mt-8 rounded-2xl bg-[#FFF7ED] p-5">
 <h2 className="font-black">Plano da empresa</h2>
 <p className="mt-1 text-sm text-black/60">Consulte recursos, uso diário e faça upgrade quando quiser.</p>
 <a href="/empresa/plano" className="mt-4 inline-flex rounded-xl bg-[#F97316] px-4 py-3 text-sm font-black text-white">
 Ver meu plano
 </a>
 </div>
 ) : null}

 {/* Editor de Avatar Modal */}
 {avatarEditorOpen && session?.user?.id ? (
 <AvatarEditor
 userId={session.user.id}
 currentPath={avatarPath ?? null}
 initials={initials}
 onUpdate={handleAvatarUpdate}
 onClose={() => setAvatarEditorOpen(false)}
 />
 ) : null}
 </>
 );
}
