# Landing Page Oficial

## Objetivo

A landing page do CotaMap apresenta a proposta de valor do produto para clientes e
autopeças, reduz dúvidas e conduz cada público ao CTA adequado. A página é totalmente
estática: nenhum botão cria cadastro, autenticação, cotação ou registro no banco nesta
fase.

## Direção visual

A interface usa exclusivamente a identidade definida:

- Laranja: `#F97316` para ação, destaque e orientação.
- Preto: `#111827` para conteúdo e áreas de alto contraste.
- Branco: `#FFFFFF` para superfícies principais.
- Cinza: `#F3F4F6` para alternância de seções e apoio visual.

O layout prioriza espaço em branco, tipografia forte, bordas arredondadas, sombras
discretas e hierarquia clara. A arte `public/og.png` foi produzida especificamente para o
CotaMap e é usada como ilustração principal e cartão social.

## Estrutura da página

1. Header com marca, navegação por âncoras e CTA.
2. Hero com slogan, campo ilustrativo, dois CTAs e arte do produto.
3. Como funciona em quatro etapas: Cliente, Pedido, Cotações e Retirada.
4. Benefícios separados para clientes e autopeças.
5. Diferenciais da experiência.
6. Área dedicada à aquisição de autopeças.
7. Estrutura de avaliações com dados explicitamente fictícios.
8. FAQ acessível com elementos HTML `details` e `summary`.
9. CTA final.
10. Footer com navegação, contato, termos, privacidade e canais sociais em preparação.

## Componentes

Cada seção possui componente próprio em `src/components/landing`:

- `Header`
- `HeroSection`
- `HowItWorksSection`
- `BenefitsSection`
- `DifferentialsSection`
- `ForBusinessesSection`
- `TestimonialsSection`
- `FaqSection`
- `FinalCtaSection`
- `Footer`

Elementos transversais evitam duplicação:

- `Container`: largura e espaçamento horizontal consistentes.
- `Logo`: assinatura visual reutilizável.
- `ButtonLink`: CTAs primário e secundário.
- `SectionHeading`: títulos e introduções de seção.
- `Reveal`: animação progressiva com Framer Motion e respeito a movimento reduzido.

Somente `Reveal` é Client Component. Todo o restante permanece Server Component, sem
estado desnecessário no navegador.

## SEO

A implementação inclui:

- `title`, descrição, palavras-chave e URL canônica.
- Open Graph em português do Brasil.
- Twitter Card de imagem ampla.
- Cartão social próprio em `public/og.png`.
- `robots.txt` por `src/app/robots.ts`.
- `sitemap.xml` por `src/app/sitemap.ts`.
- Dados estruturados Schema.org do tipo `Organization`.
- HTML semântico e hierarquia correta de títulos.

A URL pública deve ser informada por `NEXT_PUBLIC_SITE_URL` no ambiente de produção. Sem
essa variável, o projeto usa `http://localhost:3000` somente para desenvolvimento local.

## Responsividade

A construção é mobile first. Conteúdo e CTAs começam em coluna única e evoluem para
grades em telas médias e grandes. Espaçamentos, tamanhos tipográficos e densidade dos
cards usam breakpoints progressivos. Os alvos interativos mantêm dimensões adequadas para
toque e a navegação principal compacta o conteúdo em telas pequenas.

## Acessibilidade

- Idioma do documento definido como `pt-BR`.
- Regiões semânticas `header`, `nav`, `main`, `section` e `footer`.
- Textos alternativos na imagem principal.
- Ícones decorativos ocultos de tecnologias assistivas.
- Labels no campo ilustrativo e descrições para CTAs.
- Estados de foco com alto contraste.
- FAQ navegável por teclado sem JavaScript.
- Animações desativadas quando `prefers-reduced-motion` está ativo.
- Avaliações fictícias identificadas de forma explícita.

## Performance

- Renderização estática com Next.js App Router.
- Server Components por padrão.
- Um único Client Component pequeno para animação.
- `next/image` com dimensões explícitas, `sizes` responsivo e prioridade apenas para a
  imagem acima da dobra.
- Nenhum script de terceiros, integração, fonte remota ou chamada de API.
- Ícones importados individualmente do Lucide.

## Limites desta etapa

Os CTAs são navegação demonstrativa dentro da landing. Login, cadastro, solicitação de
cotação, integrações, banco, APIs, WhatsApp, Google Maps e redes sociais serão conectados
somente em fases futuras autorizadas.
