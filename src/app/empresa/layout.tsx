import type { ReactNode } from "react";

import { requireUser } from "@/features/auth/server/guards";
import { AuthProvider } from "@/providers/auth-provider";

export const dynamic = "force-dynamic";

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AuthProvider>{children}</AuthProvider>;
}
