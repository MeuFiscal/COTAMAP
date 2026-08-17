"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { AuthContext } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { PLATFORM_ADMIN_EMAIL, signOut, toAuthUser } from "@/services/auth/auth-service";
import type { AuthUser } from "@/types/auth";

type AuthProviderProps = Readonly<{ children: ReactNode }>;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let initialized = false;
    let bootstrappedToken: string | null = null;

    const bootstrap = async (current: Session) => {
      if (!current.access_token || current.access_token === bootstrappedToken) return;
      bootstrappedToken = current.access_token;
      console.log("Auth session found", current.user.email, "access token length", current.access_token.length);
      const { data, error } = await supabase.functions.invoke("ensure-platform-admin");
      console.log("ensure-platform-admin response", data, error);
      const isKnownPlatformAdmin = current.user.email?.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL;
      setIsAdmin((!error && data?.is_admin === true) || (Boolean(error) && isKnownPlatformAdmin));
    };

    const initialize = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ? toAuthUser(data.session.user) : null);
      if (data.session) await bootstrap(data.session);
      initialized = true;
      setLoading(false);
    };
    void initialize();

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setUser(next?.user ? toAuthUser(next.user) : null);
      if (!next) { bootstrappedToken = null; setIsAdmin(false); }
      if (next) void bootstrap(next);
      if (initialized) setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => { await signOut(); setSession(null); setUser(null); setIsAdmin(false); }, []);
  const value = useMemo(() => ({ user, session, loading, isAdmin, business: null, logout }), [isAdmin, loading, logout, session, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
