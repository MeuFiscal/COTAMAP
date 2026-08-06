import { NextResponse, type NextRequest } from "next/server";

import { AUTH_ROUTES } from "@/constants/auth";
import { getSafeNextPath } from "@/features/auth/utils/errors";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"), AUTH_ROUTES.dashboard);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const loginUrl = new URL(AUTH_ROUTES.login, url.origin);
  loginUrl.searchParams.set("error", "invalid_callback");
  return NextResponse.redirect(loginUrl);
}
