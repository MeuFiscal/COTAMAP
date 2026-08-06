"use client";

import { createContext } from "react";

import type { AuthUser } from "@/types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
