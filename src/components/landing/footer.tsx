import { AtSign, Mail, MessageCircle } from "lucide-react";

import { Container } from "./container";
import { Logo } from "./logo";

const footerLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Para autopeças", href: "#para-autopecas" },
  { label: "Privacidade", href: "/politica-de-privacidade" },
  { label: "Termos", href: "/termos-de-uso" },
] as const;

export function Footer() {
  return (
    <footer id="contato" className="border-t border-[#111827]/10 bg-[#F3F4F6] py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-6 text-[#111827]/60">
              Cotações inteligentes para conectar clientes e autopeças próximas, sem cadastro de
              estoque.
            </p>
          </div>
          <nav
            className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm font-bold sm:grid-cols-3"
            aria-label="Navegação do rodapé"
          >
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="rounded text-[#111827]/60 transition hover:text-[#F97316]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-5 border-t border-[#111827]/10 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#111827]/50">
            © {new Date().getFullYear()} CotaMap. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-3" aria-label="Canais do CotaMap">
            <a
              href="mailto:contato@cotamap.com.br"
              aria-label="E-mail do CotaMap"
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <a
              href="#para-autopecas"
              aria-label=""
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <MessageCircle aria-hidden="true" className="size-4" />
            </a>
            <a
              href="#inicio"
              aria-label=""
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <AtSign aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-x-2 text-xs text-[#111827]/50">
          <a id="privacidade" href="/politica-de-privacidade" className="hover:text-[#F97316]">Política de privacidade</a>
          <span aria-hidden="true">•</span>
          <a id="termos" href="/termos-de-uso" className="hover:text-[#F97316]">Termos de uso</a>
        </div>
      </Container>
    </footer>
  );
}
