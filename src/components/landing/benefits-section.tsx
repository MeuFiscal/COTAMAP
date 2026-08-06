import {
  BadgeDollarSign,
  Clock3,
  Megaphone,
  MousePointerClick,
  Store,
  UserRound,
} from "lucide-react";

import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const customerBenefits = [
  {
    icon: Clock3,
    title: "Menos espera",
    text: "Um pedido substitui várias ligações e mensagens repetidas.",
  },
  {
    icon: BadgeDollarSign,
    title: "Mais poder de escolha",
    text: "Compare até cinco propostas antes de decidir.",
  },
  {
    icon: MousePointerClick,
    title: "Contato no momento certo",
    text: "WhatsApp e rota aparecem depois da sua escolha.",
  },
] as const;

const businessBenefits = [
  {
    icon: Megaphone,
    title: "Demanda próxima",
    text: "Receba oportunidades de clientes na sua região.",
  },
  {
    icon: Store,
    title: "Sem cadastrar estoque",
    text: "Responda somente ao que sua loja consegue atender.",
  },
  {
    icon: UserRound,
    title: "Intenção real",
    text: "Converse com quem já comparou e escolheu sua proposta.",
  },
] as const;

type BenefitCardProps = Readonly<{
  title: string;
  description: string;
  benefits: typeof customerBenefits | typeof businessBenefits;
  accent?: boolean;
}>;

function BenefitCard({ title, description, benefits, accent = false }: BenefitCardProps) {
  return (
    <article
      className={`h-full rounded-[2rem] border p-7 sm:p-9 ${accent ? "border-[#F97316] bg-[#111827] text-[#FFFFFF]" : "border-[#111827]/10 bg-[#FFFFFF] text-[#111827]"}`}
    >
      <p
        className={`text-xs font-black uppercase tracking-[0.16em] ${accent ? "text-[#F97316]" : "text-[#111827]/50"}`}
      >
        Para
      </p>
      <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">{title}</h3>
      <p className={`mt-3 leading-7 ${accent ? "text-[#FFFFFF]/70" : "text-[#111827]/70"}`}>
        {description}
      </p>
      <ul className="mt-8 space-y-6">
        {benefits.map(({ icon: Icon, title: itemTitle, text }) => (
          <li key={itemTitle} className="flex gap-4">
            <span
              className={`grid size-11 shrink-0 place-items-center rounded-xl ${accent ? "bg-[#F97316] text-[#FFFFFF]" : "bg-[#F3F4F6] text-[#F97316]"}`}
            >
              <Icon aria-hidden="true" className="size-5" />
            </span>
            <span>
              <strong className="block text-base">{itemTitle}</strong>
              <span
                className={`mt-1 block text-sm leading-6 ${accent ? "text-[#FFFFFF]/60" : "text-[#111827]/60"}`}
              >
                {text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Benefícios"
            title="Bom para quem procura. Melhor para quem vende."
            description="O CotaMap aproxima uma necessidade concreta de quem pode resolvê-la, com menos atrito dos dois lados."
            centered
          />
        </Reveal>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <BenefitCard
              title="o cliente"
              description="Encontre opções próximas sem perder a manhã ao telefone."
              benefits={customerBenefits}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <BenefitCard
              title="a autopeça"
              description="Transforme pedidos locais em novas oportunidades de venda."
              benefits={businessBenefits}
              accent
            />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
