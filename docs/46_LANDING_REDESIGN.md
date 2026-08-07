# Redesign da Landing Page

A landing pública foi reconstruída com uma hero dark premium, CTAs orientados à conversão e um mapa vetorial próprio em SVG/CSS. O mapa é ilustrativo, não usa Google Maps, Leaflet, Mapbox ou qualquer API externa, e anima pins, rota e estado de busca.

O cabeçalho agora alterna entre um estado transparente sobre o hero e um estado glass com blur e sombra durante o scroll. A antiga seção de depoimentos fictícios foi substituída por “Por que confiar no CotaMap”, baseada apenas em capacidades reais do produto.

As seções existentes de fluxo, benefícios, diferenciais, autopeças, FAQ, CTA e footer foram preservadas como componentes reutilizáveis. O SEO continua usando metadata, Open Graph, Twitter Cards, manifest e Organization JSON-LD. A hero usa Framer Motion e respeita `prefers-reduced-motion` pelo CSS global.
