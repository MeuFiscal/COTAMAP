import { Star } from "lucide-react";

import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const testimonials = [
  {
    quote:
      "Em vez de falar com loja por loja, eu faria um pedido e compararia tudo no mesmo lugar.",
    name: "Marina A.",
    context: "Motorista • cenário ilustrativo",
  },
  {
    quote: "Receber a demanda pronta e perto da loja deixa a equipe focada em responder e vender.",
    name: "Carlos R.",
    context: "Autopeça • cenário ilustrativo",
  },
  {
    quote: "Foto, preço e distância juntos tornam a decisão muito mais simples e objetiva.",
    name: "Rafael M.",
    context: "Motorista • cenário ilustrativo",
  },
] as const;

export function TestimonialsSection() {
  return (
    <section className="bg-[#F3F4F6] py-20 sm:py-24 lg:py-32" aria-labelledby="testimonials-title">
      <Container>
        <Reveal>
          <div id="testimonials-title">
            <SectionHeading
              eyebrow="Avaliações"
              title="Uma experiência desenhada para facilitar a vida real."
              description="Depoimentos fictícios usados apenas para demonstrar a estrutura futura de avaliações do CotaMap."
              centered
            />
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 0.06}>
              <figure className="h-full rounded-3xl border border-[#111827]/10 bg-[#FFFFFF] p-7 shadow-[0_12px_35px_rgba(17,24,39,0.05)]">
                <div className="flex gap-1 text-[#F97316]" aria-label="5 de 5 estrelas">
                  {Array.from({ length: 5 }, (_, star) => (
                    <Star key={star} aria-hidden="true" className="size-4 fill-[#F97316]" />
                  ))}
                </div>
                <blockquote className="mt-6 text-lg font-bold leading-8 text-[#111827]">
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-7 border-t border-[#111827]/10 pt-5">
                  <strong className="block text-sm text-[#111827]">{testimonial.name}</strong>
                  <span className="mt-1 block text-xs text-[#111827]/50">
                    {testimonial.context}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
