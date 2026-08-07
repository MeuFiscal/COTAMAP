import { CheckCircle2 } from "lucide-react";

import { FormMessage } from "@/features/auth/components/auth-elements";

export function AccountCreatedMessage() {
  return (
    <FormMessage success>
      <span className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#F97316]" aria-hidden="true" />
        <span>
          <strong className="block">Conta criada com sucesso!</strong>
          <span className="mt-0.5 block text-xs font-medium text-[#111827]/60">
            Redirecionando...
          </span>
        </span>
      </span>
    </FormMessage>
  );
}
