import { Container } from "./container";
import { Logo } from "./logo";

const navigation = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Para autopeças", href: "#para-autopecas" },
  { label: "FAQ", href: "#faq" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#111827]/5 bg-[#FFFFFF]/95 backdrop-blur-xl">
      <Container className="flex min-h-16 items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-md text-sm font-bold text-[#111827]/70 transition hover:text-[#F97316]"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#solicitar"
          className="rounded-xl bg-[#111827] px-4 py-2.5 text-xs font-black text-[#FFFFFF] transition hover:bg-[#F97316] sm:text-sm"
        >
          Solicitar cotação
        </a>
      </Container>
    </header>
  );
}
