import type { ReactNode } from "react";

import { PrivateShell } from "@/features/auth/components/private-shell";

export function BusinessShell({ children }: { children: ReactNode }) {
  return <PrivateShell>{children}</PrivateShell>;
}
