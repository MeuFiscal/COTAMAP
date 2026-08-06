# Arquitetura

## Direção arquitetural

O CotaMap adotará Clean Architecture com módulos por feature. A regra de dependência é
sempre do detalhe externo para os contratos internos; domínio e casos de uso não devem
depender de Next.js, Supabase, interface ou mecanismos de entrega.

## Linguagem do domínio

A arquitetura interna será genérica, enquanto o produto inicial continuará sendo
exclusivamente voltado a autopeças. Essa separação permite evolução futura sem diluir o
posicionamento atual do CotaMap.

Para representar uma empresa, toda implementação futura deverá usar a nomenclatura
canônica abaixo:

- Entidade ou conceito singular: `business`, nunca `store`.
- Identificador: `business_id`, nunca `store_id`.
- Coleção ou recurso plural: `businesses`, nunca `stores`.

Essa regra vale para domínio, tipos, contratos, banco de dados, APIs, eventos e código.
Textos apresentados ao usuário poderão empregar “loja” quando isso for mais natural para
o mercado de autopeças.

## Usuários e empresas

A arquitetura deverá comportar futuramente os perfis `Owner`, `Manager`, `Employee`,
`Customer` e `Admin`, sem antecipar autenticação, autorização ou regras de permissão.

Um `Business` poderá possuir vários usuários funcionários. A cadeia conceitual prevista é:

`Business` → `Employees` → `Notifications` → `Quotes`

O domínio de empresa deverá poder evoluir para logo, foto da fachada, banner, WhatsApp,
Instagram, website, horário, localização, funcionários e avaliações. Essa previsão não
define entidades, campos, tabelas, relacionamentos físicos ou mecanismos de armazenamento.

## Camadas planejadas

1. **Domínio**: entidades, objetos de valor, políticas e contratos sem dependência de
   framework.
2. **Aplicação**: casos de uso, portas de entrada e saída e orquestração.
3. **Infraestrutura**: adaptadores de Supabase, persistência, notificações e serviços
   externos.
4. **Apresentação**: rotas, componentes, hooks e estados específicos da interface.

## Estrutura

- `src/app`: App Router, layouts e pontos de composição.
- `src/features`: módulos verticais. Cada feature poderá conter `domain`, `application`,
  `infrastructure` e `presentation` conforme a necessidade real.
- `src/components`: apenas componentes reutilizáveis entre features.
- `src/config`: configurações centralizadas do projeto e de suas integrações.
- `src/constants`: constantes globais compartilhadas pela aplicação.
- `src/providers`: composição dos providers React usados pela aplicação.
- `src/contexts`: contratos e contextos React de alcance global.
- `src/services`: contratos e integrações transversais.
- `src/lib`: configuração e adaptadores técnicos compartilhados.
- `src/hooks`: hooks genéricos sem regra de negócio.
- `src/types`: tipos globais inevitavelmente compartilhados.
- `src/utils`: funções puras, pequenas e genéricas.
- `src/styles`: estilos globais e tokens.

Esta estrutura foi expandida para acomodar o crescimento futuro do projeto sem antecipar
implementações, configurações ou dependências que ainda não foram definidas.

## Regras de dependência

- Componentes não acessam Supabase diretamente.
- Regras de negócio não residem em componentes, hooks de UI ou rotas.
- Casos de uso dependem de interfaces, não de implementações.
- Adaptadores externos implementam contratos definidos internamente.
- Features não importam detalhes internos umas das outras; integrações usam contratos
  públicos explícitos.
- Código compartilhado só é extraído após uso real justificar a abstração.

## Portabilidade

Domínio e aplicação serão TypeScript independentes da interface para permitir reuso ou
adaptação em web, Android e futura versão iOS. Componentes visuais da web não serão
tratados como portáveis para plataformas nativas.

## Qualidade e segurança

- TypeScript em modo estrito e proibição de `any` explícito.
- Validação de entradas nas fronteiras do sistema.
- Princípio do menor privilégio e Row Level Security no futuro banco.
- Segredos somente no servidor e em variáveis de ambiente.
- Testes unitários para domínio e aplicação; integração para adaptadores; ponta a ponta
  para jornadas críticas.
- Decisões arquiteturais relevantes serão registradas como ADRs em `docs/adr`.

## Supabase

O diretório `supabase` está reservado para configuração local e migrations futuras.
Nenhum schema, migration, cliente, autenticação ou política foi criado nesta etapa. A
`DATABASE_URL` deverá ser configurada manualmente antes de qualquer operação de banco.

## Congelamento da arquitetura base

Com esta padronização, a arquitetura estrutural base do CotaMap é considerada congelada.
Novas alterações de estrutura só deverão ocorrer quando houver necessidade técnica
comprovada e documentada. A implementação das fases seguintes deve preservar as decisões
e os limites registrados neste documento.
