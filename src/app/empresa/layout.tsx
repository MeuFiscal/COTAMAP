import type { ReactNode } from "react";

import { requireUser } from "@/features/auth/server/guards";
import { AuthProvider } from "@/providers/auth-provider";
import { OperatorProvider } from "@/features/business/context/operator-context";

export const dynamic = "force-dynamic";

export default async function BusinessLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AuthProvider><OperatorProvider>{children}</OperatorProvider></AuthProvider>;
}
