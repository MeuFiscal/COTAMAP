import { Plus } from "lucide-react";

import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const questions = [
  {
    question: "O CotaMap vende autopeças?",
    answer:
      "Não. O CotaMap conecta seu pedido a autopeças próximas para que elas enviem propostas diretamente pela plataforma.",
  },
  {
    question: "Quantas cotações posso receber?",
    answer:
      "Cada solicitação poderá receber até cinco cotações, mantendo a comparação objetiva e fácil de analisar.",
  },
  {
    question: "As lojas precisam cadastrar todo o estoque?",
    answer:
      "Não. As autopeças respondem às solicitações em tempo real, somente quando possuem uma opção para oferecer.",
  },
  {
    question: "Quando vejo o WhatsApp e a localização?",
    answer:
      "Os dados de contato e a rota no Google Maps são liberados após você escolher uma cotação.",
  },
  {
    question: "Posso enviar uma foto da peça?",
    answer:
      "A experiência foi preparada para permitir fotos no pedido e também na resposta da autopeça, ajudando na conferência visual.",
  },
  {
    question: "O serviço já está disponível?",
    answer:
      "A plataforma está em preparação. Esta página apresenta a experiência planejada para clientes e autopeças.",
  },
] as const;

export function FaqSection() {
  return (
    <section id="faq" className="py-20 sm:py-24 lg:py-32">
      <Container className="max-w-5xl">
        <Reveal>
          <SectionHeading
            eyebrow="Perguntas frequentes"
            title="Tudo claro antes do primeiro pedido."
            description="Entenda os pontos essenciais da proposta do CotaMap."
            centered
          />
        </Reveal>
        <div className="mt-12 space-y-3">
          {questions.map(({ question, answer }, index) => (
            <Reveal key={question} delay={(index % 3) * 0.04}>
              <details className="group rounded-2xl border border-[#111827]/10 bg-[#FFFFFF] px-5 py-1 open:shadow-[0_12px_35px_rgba(17,24,39,0.06)] sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 font-extrabold text-[#111827]">
                  {question}
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F3F4F6] text-[#F97316] transition group-open:rotate-45">
                    <Plus aria-hidden="true" className="size-4" />
                  </span>
                </summary>
                <p className="max-w-3xl pb-6 pr-10 leading-7 text-[#111827]/70">{answer}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
