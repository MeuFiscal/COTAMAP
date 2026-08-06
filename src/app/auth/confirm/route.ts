import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES } from "@/constants/auth";
import { getSafeNextPath } from "@/features/auth/utils/errors";
import { createClient } from "@/lib/supabase/server";

const allowedTypes: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && allowedTypes.includes(value as EmailOtpType);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = getSafeNextPath(url.searchParams.get("next"), AUTH_ROUTES.dashboard);

  if (tokenHash && isEmailOtpType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const loginUrl = new URL(AUTH_ROUTES.login, url.origin);
  loginUrl.searchParams.set("error", "invalid_confirmation");
  return NextResponse.redirect(loginUrl);
}
