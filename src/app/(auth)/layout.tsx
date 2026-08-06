import type { ReactNode } from "react";

import { AuthProvider } from "@/providers/auth-provider";

export default function PublicAuthLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
