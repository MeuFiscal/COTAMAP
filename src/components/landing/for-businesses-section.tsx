import { ArrowUpRight, BellRing, CircleDollarSign, Store } from "lucide-react";

import { ButtonLink } from "./button-link";
import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const highlights = [
  { icon: BellRing, value: "Tempo real", label: "Novos pedidos próximos" },
  { icon: CircleDollarSign, value: "Mais vendas", label: "Oportunidades qualificadas" },
  { icon: Store, value: "Zero estoque", label: "Sem catálogo para manter" },
] as const;

export function ForBusinessesSection() {
  return (
    <section id="para-autopecas" className="py-20 sm:py-24 lg:py-32">
      <Container>
        <div className="overflow-hidden rounded-[2rem] bg-[#111827] px-6 py-10 text-[#FFFFFF] shadow-[0_30px_80px_rgba(17,24,39,0.18)] sm:px-10 sm:py-14 lg:px-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <Reveal>
              <SectionHeading
                eyebrow="Para autopeças"
                title="Sua próxima venda pode estar a poucos quilômetros."
                description="Receba solicitações de clientes próximos, responda apenas quando puder atender e conquiste novos compradores sem cadastrar estoque."
                inverted
              />
              <div className="mt-8">
                <ButtonLink href="#cta-final">Quero cadastrar minha empresa</ButtonLink>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                {highlights.map(({ icon: Icon, value, label }) => (
                  <div
                    key={value}
                    className="flex items-center gap-4 rounded-2xl border border-[#FFFFFF]/10 bg-[#FFFFFF]/5 p-5"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F97316] text-[#FFFFFF]">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-lg">{value}</strong>
                      <span className="text-sm text-[#FFFFFF]/60">{label}</span>
                    </span>
                    <ArrowUpRight aria-hidden="true" className="size-5 text-[#F97316]" />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
