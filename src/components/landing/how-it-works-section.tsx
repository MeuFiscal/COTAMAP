import { CarFront, ClipboardList, PackageCheck, Tags } from "lucide-react";

import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const steps = [
  { icon: CarFront, title: "Cliente", description: "Conte qual peça você precisa e onde está." },
  {
    icon: ClipboardList,
    title: "Pedido",
    description: "Sua solicitação chega às autopeças próximas.",
  },
  { icon: Tags, title: "Cotações", description: "Receba e compare até cinco propostas." },
  {
    icon: PackageCheck,
    title: "Retirada",
    description: "Escolha, fale com a loja e trace a rota.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="bg-[#F3F4F6] py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Como funciona"
            title="Da necessidade à peça certa, sem maratona de ligações."
            description="Um fluxo direto para você economizar tempo e para a autopeça receber pedidos com intenção real de compra."
            centered
          />
        </Reveal>
        <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 0.06}>
              <article className="h-full rounded-3xl border border-[#111827]/10 bg-[#FFFFFF] p-6 shadow-[0_12px_35px_rgba(17,24,39,0.06)]">
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#F97316] text-[#FFFFFF]">
                    <Icon aria-hidden="true" className="size-6" />
                  </span>
                  <span className="text-4xl font-black text-[#111827]/10">0{index + 1}</span>
                </div>
                <h3 className="mt-8 text-xl font-black text-[#111827]">{title}</h3>
                <p className="mt-3 leading-7 text-[#111827]/70">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
