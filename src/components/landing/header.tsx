"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Container } from "./container";
import { Logo } from "./logo";

const navigation = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Para autopeças", href: "#para-autopecas" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shellClass = scrolled
    ? "border-[#111827]/10 bg-white/85 shadow-[0_10px_35px_rgba(17,24,39,.08)] backdrop-blur-2xl"
    : "border-white/10 bg-[#0b1120]/90 backdrop-blur-xl";
  const linkClass = scrolled
    ? "text-[#111827]/70 hover:text-[#F97316]"
    : "text-white/70 hover:text-white";

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-500 ${shellClass}`}>
      <Container className="flex min-h-16 items-center justify-between gap-4">
        <Logo light={!scrolled} />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className={`rounded-md text-sm font-bold transition ${linkClass}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/entrar"
            className={`rounded-xl px-2 py-2.5 text-xs font-black transition sm:px-3 sm:text-sm ${
              scrolled ? "text-[#111827] hover:text-[#F97316]" : "text-white hover:text-[#fb923c]"
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className={`rounded-xl px-3 py-2.5 text-xs font-black transition sm:px-4 sm:text-sm ${
              scrolled
                ? "bg-[#111827] text-white hover:bg-[#F97316]"
                : "bg-white text-[#111827] hover:bg-[#fb923c] hover:text-white"
            }`}
          >
            Criar conta
          </Link>
        </div>
      </Container>
    </header>
  );
}
