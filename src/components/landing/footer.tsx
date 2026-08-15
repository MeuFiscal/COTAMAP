import { Mail } from "lucide-react";

import { Container } from "./container";
import { Logo } from "./logo";

const footerLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Para autopeças", href: "#para-autopecas" },
  { label: "Privacidade", href: "/politica-de-privacidade" },
  { label: "Termos", href: "/termos-de-uso" },
] as const;

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.074-.297-.148-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.002-5.45 4.436-9.893 9.892-9.893a9.82 9.82 0 0 1 7.021 2.91 9.83 9.83 0 0 1 2.9 7.01c-.003 5.45-4.437 9.893-9.929 9.866" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

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
              href="mailto:cotamapapp@gmail.com"
              aria-label="Enviar e-mail para CotaMap"
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <Mail aria-hidden="true" className="size-4" />
            </a>
            <a
              href="https://wa.me/5515988218568?text=Ol%C3%A1%2C%20vim%20pelo%20App%20CotaMap"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar com CotaMap pelo WhatsApp"
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <WhatsAppIcon />
            </a>
            <a
              href="https://www.instagram.com/cota_map?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do CotaMap"
              className="grid size-9 place-items-center rounded-full bg-[#FFFFFF] text-[#111827] transition hover:text-[#F97316]"
            >
              <InstagramIcon />
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
