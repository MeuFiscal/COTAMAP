"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { invokeEnsureBusinessAccount } from "@/services/auth/auth-service";

type Props = { businessName: string };

export function BusinessBootstrapStatus({ businessName }: Props) {
  const [state, setState] = useState<"loading" | "created" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void invokeEnsureBusinessAccount(createClient()).then(({ data, error }) => {
      if (!active) return;
      if (error || !data?.business_id) {
        setState("error");
        setMessage(error?.message ?? "Não foi possível confirmar o cadastro empresarial.");
        return;
      }
      setState("created");
    });
    return () => { active = false; };
  }, []);

  if (state === "loading") {
    return <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#F3F4F6] p-5 text-sm font-semibold"><Loader2 className="size-5 animate-spin text-[#F97316]" /> Confirmando o cadastro de {businessName}…</div>;
  }

  if (state === "error") {
    return <div role="alert" className="mt-8 rounded-2xl bg-[#FFF7ED] p-5 text-sm leading-6 text-[#9A3412]">{message}</div>;
  }

  return <div className="mt-8 flex gap-3 rounded-2xl bg-[#F3F4F6] p-5"><CheckCircle2 className="size-6 shrink-0 text-[#F97316]" /><p className="text-sm leading-6"><strong className="block">Cadastro inicial concluído</strong>Empresa criada com sucesso. Agora vamos concluir os dados da sua empresa.</p></div>;
}
