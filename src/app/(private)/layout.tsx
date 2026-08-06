import type { ReactNode } from "react";

import { requireUser } from "@/features/auth/server/guards";
import { AuthProvider } from "@/providers/auth-provider";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AuthProvider>{children}</AuthProvider>;
}
