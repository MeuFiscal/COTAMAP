import { MapPin, Tags } from "lucide-react";

import { ButtonLink } from "./button-link";
import { Container } from "./container";
import { Reveal } from "./reveal";

export function FinalCtaSection() {
  return (
    <section id="cta-final" className="pb-20 sm:pb-24 lg:pb-32">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#F97316] px-6 py-14 text-center text-[#FFFFFF] shadow-[0_30px_80px_rgba(249,115,22,0.25)] sm:px-12 sm:py-20">
            <MapPin
              aria-hidden="true"
              className="absolute -left-8 -top-8 size-36 rotate-12 text-[#FFFFFF]/10"
            />
            <Tags
              aria-hidden="true"
              className="absolute -bottom-10 -right-6 size-40 -rotate-12 text-[#FFFFFF]/10"
            />
            <div className="relative mx-auto max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em]">Seu tempo vale mais</p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Uma solicitação. Até cinco caminhos para a peça certa.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-pretty leading-7 text-[#FFFFFF]/80 sm:text-lg">
                Deixe o CotaMap encontrar as autopeças próximas enquanto você compara as melhores
                opções.
              </p>
              <div className="mt-8">
                <ButtonLink
                  href="#solicitar"
                  variant="secondary"
                  className="min-w-56 border-[#FFFFFF]"
                >
                  Solicitar cotação
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
