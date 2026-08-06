import { Check, MapPin, Search, ShieldCheck, Timer } from "lucide-react";
import Image from "next/image";

import { ButtonLink } from "./button-link";
import { Container } from "./container";
import { Reveal } from "./reveal";

const trustItems = [
  { icon: Timer, label: "Pedido em poucos minutos" },
  { icon: MapPin, label: "Lojas próximas" },
  { icon: ShieldCheck, label: "Contato só após escolher" },
] as const;

export function HeroSection() {
  return (
    <section id="inicio" className="overflow-hidden pb-20 pt-12 sm:pt-16 lg:pb-28 lg:pt-20">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/25 bg-[#F97316]/10 px-3 py-2 text-xs font-black text-[#111827]">
              <span className="size-2 rounded-full bg-[#F97316]" aria-hidden="true" />
              Cotação inteligente de autopeças
            </div>
            <h1 className="mt-6 text-balance text-4xl font-black leading-[1.02] tracking-[-0.055em] text-[#111827] sm:text-6xl lg:text-7xl">
              Pare de ligar para várias autopeças.
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[#111827]/70 sm:text-xl">
              Faça um único pedido e receba até{" "}
              <strong className="text-[#111827]">5 cotações</strong> de lojas próximas. Compare com
              calma e escolha a melhor para você.
            </p>

            <div
              id="solicitar"
              className="mt-8 rounded-2xl border border-[#111827]/10 bg-[#FFFFFF] p-2 shadow-[0_20px_60px_rgba(17,24,39,0.10)]"
            >
              <div className="flex items-center gap-3 px-3 py-2">
                <Search aria-hidden="true" className="size-5 shrink-0 text-[#F97316]" />
                <label htmlFor="part-search" className="sr-only">
                  Peça que você procura
                </label>
                <input
                  id="part-search"
                  readOnly
                  value="Ex.: farol do Onix 2020"
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#111827]/60 outline-none sm:text-base"
                  aria-describedby="search-help"
                />
              </div>
              <p id="search-help" className="sr-only">
                Campo ilustrativo. O fluxo de cotação será disponibilizado em breve.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="#cta-final" className="sm:flex-1">
                Solicitar cotação
              </ButtonLink>
              <ButtonLink href="#para-autopecas" variant="secondary" className="sm:flex-1">
                Cadastrar minha autopeça
              </ButtonLink>
            </div>

            <ul className="mt-8 grid gap-3 text-sm font-bold text-[#111827]/70 sm:grid-cols-3">
              {trustItems.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon aria-hidden="true" className="size-4 text-[#F97316]" />
                  {label}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="relative">
            <div
              className="absolute -inset-8 -z-10 rounded-full bg-[#F97316]/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="overflow-hidden rounded-[2rem] border border-[#111827]/10 bg-[#F3F4F6] p-2 shadow-[0_30px_80px_rgba(17,24,39,0.14)] sm:p-3">
              <Image
                src="/og.png"
                alt="Ilustração do CotaMap com pedido de uma peça, cinco cotações e localização"
                width={1792}
                height={1024}
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="h-auto w-full rounded-[1.5rem]"
              />
            </div>
            <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-[#111827]/10 bg-[#FFFFFF] px-4 py-3 shadow-[0_18px_45px_rgba(17,24,39,0.14)] sm:left-8">
              <span className="grid size-9 place-items-center rounded-full bg-[#F97316] text-[#FFFFFF]">
                <Check aria-hidden="true" className="size-5" />
              </span>
              <span>
                <strong className="block text-sm text-[#111827]">5 propostas recebidas</strong>
                <span className="text-xs text-[#111827]/60">Prontas para comparar</span>
              </span>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
