import { Camera, Gauge, Map, MapPin, MessageCircle, Send, Tags } from "lucide-react";

import { Container } from "./container";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const differentials = [
  {
    icon: Camera,
    title: "Foto da peça",
    text: "Mostre visualmente o que procura e reduza dúvidas.",
  },
  {
    icon: Send,
    title: "Foto enviada pela loja",
    text: "Confira a opção oferecida antes de escolher.",
  },
  { icon: Map, title: "Google Maps", text: "Veja a rota até a autopeça selecionada." },
  { icon: MessageCircle, title: "WhatsApp", text: "Converse diretamente após aceitar a cotação." },
  {
    icon: Tags,
    title: "Até 5 cotações",
    text: "Compare opções sem receber uma avalanche de mensagens.",
  },
  { icon: MapPin, title: "Geolocalização", text: "Priorize empresas próximas da sua localização." },
  {
    icon: Gauge,
    title: "Resposta rápida",
    text: "Solicitações em tempo real, sem depender de estoque cadastrado.",
  },
] as const;

export function DifferentialsSection() {
  return (
    <section className="bg-[#F3F4F6] py-20 sm:py-24 lg:py-32">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Diferenciais"
            title="Tudo o que ajuda você a decidir com segurança."
            description="Informação visual, proximidade e contato direto reunidos em uma experiência simples."
          />
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {differentials.map(({ icon: Icon, title, text }, index) => (
            <Reveal
              key={title}
              delay={(index % 4) * 0.05}
              className={index === 6 ? "sm:col-span-2 lg:col-span-2" : ""}
            >
              <article className="group h-full rounded-2xl border border-[#111827]/10 bg-[#FFFFFF] p-6 transition duration-200 hover:-translate-y-1 hover:border-[#F97316]/50 hover:shadow-[0_16px_40px_rgba(17,24,39,0.08)]">
                <span className="grid size-11 place-items-center rounded-xl bg-[#F97316]/10 text-[#F97316] transition group-hover:bg-[#F97316] group-hover:text-[#FFFFFF]">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-6 font-black text-[#111827]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#111827]/60">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
