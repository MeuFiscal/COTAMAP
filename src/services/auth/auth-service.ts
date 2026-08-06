import type { User } from "@supabase/supabase-js";

import { AUTH_ROUTES } from "@/constants/auth";
import { digitsOnly } from "@/features/auth/utils/formatters";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser, BusinessSignUpInput, CustomerSignUpInput, Profile } from "@/types/auth";

function getCallbackUrl(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : "",
    accountType: user.user_metadata.account_type === "business" ? "business" : "customer",
  };
}

export async function signIn(email: string, password: string) {
  return createClient().auth.signInWithPassword({ email, password });
}

export async function signUpCustomer(input: CustomerSignUpInput) {
  return createClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: getCallbackUrl(AUTH_ROUTES.verifyEmail),
      data: {
        account_type: "customer",
        full_name: input.fullName,
        phone: digitsOnly(input.phone),
      },
    },
  });
}

export async function signUpBusiness(input: BusinessSignUpInput) {
  return createClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: getCallbackUrl(AUTH_ROUTES.completeRegistration),
      data: {
        account_type: "business",
        business_name: input.businessName,
        full_name: input.responsibleName,
        phone: digitsOnly(input.phone),
        whatsapp: digitsOnly(input.whatsapp),
        postal_code: digitsOnly(input.postalCode),
        address_number: input.addressNumber,
      },
    },
  });
}

export async function resendConfirmation(email: string) {
  return createClient().auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: getCallbackUrl(AUTH_ROUTES.verifyEmail) },
  });
}

export async function requestPasswordReset(email: string) {
  return createClient().auth.resetPasswordForEmail(email, {
    redirectTo: getCallbackUrl(AUTH_ROUTES.resetPassword),
  });
}

export async function updatePassword(password: string) {
  return createClient().auth.updateUser({ password });
}

export async function signOut() {
  return createClient().auth.signOut();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await createClient()
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, fullName: string, phone: string) {
  const normalizedPhone = digitsOnly(phone);
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: normalizedPhone })
    .eq("id", userId);

  if (error) throw error;
  return supabase.auth.updateUser({ data: { full_name: fullName, phone: normalizedPhone } });
}

export async function getPostLoginPath(user: User): Promise<string> {
  if (user.user_metadata.account_type === "business") {
    return AUTH_ROUTES.completeRegistration;
  }

  const profile = await getProfile(user.id);
  return profile?.role === "admin" ? AUTH_ROUTES.admin : AUTH_ROUTES.dashboard;
}
