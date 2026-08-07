import type { AuthResponse, User } from "@supabase/supabase-js";

import { AUTH_ROUTES } from "@/constants/auth";
import { digitsOnly } from "@/features/auth/utils/formatters";
import { createClient } from "@/lib/supabase/client";
import type { AuthUser, BusinessSignUpInput, CustomerSignUpInput, Profile } from "@/types/auth";

const SESSION_WAIT_ATTEMPTS = 10;
const SESSION_WAIT_INTERVAL_MS = 50;

function getPasswordResetCallbackUrl(): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(AUTH_ROUTES.resetPassword)}`;
}

async function ensureAuthenticatedAfterSignUp(
  email: string,
  password: string,
  signUpResult: AuthResponse,
): Promise<AuthResponse> {
  if (signUpResult.error || signUpResult.data.session) {
    return signUpResult;
  }

  return createClient().auth.signInWithPassword({ email, password });
}

async function waitForAuthenticatedSession() {
  const supabase = createClient();

  for (let attempt = 0; attempt < SESSION_WAIT_ATTEMPTS; attempt += 1) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return { supabase, session: data.session };

    await new Promise<void>((resolve) => window.setTimeout(resolve, SESSION_WAIT_INTERVAL_MS));
  }

  throw new Error("Sessão de autenticação ainda não está disponível.");
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
  const supabase = createClient();
  const result = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        account_type: "customer",
        full_name: input.fullName,
        phone: digitsOnly(input.phone),
      },
    },
  });

  return ensureAuthenticatedAfterSignUp(input.email, input.password, result);
}

export async function signUpBusiness(input: BusinessSignUpInput) {
  const supabase = createClient();
  const result = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
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

  return ensureAuthenticatedAfterSignUp(input.email, input.password, result);
}

export async function requestPasswordReset(email: string) {
  return createClient().auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordResetCallbackUrl(),
  });
}

export async function updatePassword(password: string) {
  return createClient().auth.updateUser({ password });
}

export async function signOut() {
  return createClient().auth.signOut();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { supabase, session } = await waitForAuthenticatedSession();
  if (session.user.id !== userId) {
    throw new Error("A sessão autenticada não corresponde ao perfil solicitado.");
  }

  const { data, error } = await supabase
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

  const { data: platformAdmin } = await createClient().from("platform_admins").select("id").eq("active", true).maybeSingle();
  return platformAdmin ? AUTH_ROUTES.admin : AUTH_ROUTES.dashboard;
}
