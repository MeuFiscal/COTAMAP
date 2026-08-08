"use client";

import { createContext } from "react";

import type { AuthUser } from "@/types/auth";
import type { Session } from "@supabase/supabase-js";

export type AuthContextValue = {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  business: null;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
