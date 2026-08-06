"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AuthContext } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { signOut, toAuthUser } from "@/services/auth/auth-service";
import type { AuthUser } from "@/types/auth";

type AuthProviderProps = Readonly<{ children: ReactNode }>;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? toAuthUser(data.user) : null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toAuthUser(session.user) : null);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, logout }), [loading, logout, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
