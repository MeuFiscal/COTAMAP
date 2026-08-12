# CotaMap

SaaS de cotações inteligentes que conecta clientes a lojas de autopeças próximas por
meio de solicitações em tempo real, sem cadastro de estoque.

## Estado do projeto

O repositório contém somente a fundação técnica e documental. Nesta etapa não existem
telas, autenticação, APIs, banco de dados, migrations ou regras de negócio implementadas.

## Stack planejada

- Next.js com App Router e TypeScript estrito
- Tailwind CSS
- Supabase (PostgreSQL, PostGIS, Auth e Storage)
- ESLint e Prettier
- Vercel

## Pré-requisitos

- Node.js 20 ou superior
- npm 10 ou superior
- Supabase CLI, quando a etapa de infraestrutura for autorizada

## Preparação local

1. Instale as dependências com `npm install`.
2. Copie `.env.example` para `.env.local`.
3. Configure `DATABASE_URL` manualmente somente quando a etapa de banco for iniciada.

Os comandos de desenvolvimento serão habilitados quando o App Router receber sua
primeira rota. Nenhuma credencial privada deve ser versionada.

## Qualidade

- `npm run typecheck`: valida os tipos TypeScript.
- `npm run lint`: executa as regras estáticas.
- `npm run format:check`: verifica a formatação.
- `npm run build`: gera a compilação de produção quando houver uma aplicação.

O arquivo `eslint.config.mjs` é a configuração ativa do ESLint moderno. O `.eslintrc`
permanece como marcador de compatibilidade solicitado para ferramentas legadas, sem
duplicar regras.

## Organização

```text
src/
├── app/          # rotas, layouts e composição do App Router
├── components/   # componentes de interface compartilhados
├── features/     # módulos verticais por capacidade de negócio
├── hooks/        # hooks reutilizáveis e independentes de features
├── services/     # contratos e integrações externas
├── lib/          # configuração técnica e adaptadores
├── types/        # tipos compartilhados
├── utils/        # funções puras e genéricas
└── styles/       # estilos globais e tokens
```

Consulte [`docs/03_ARQUITETURA.md`](docs/03_ARQUITETURA.md) antes de implementar uma
feature.

## Licença

Uso proprietário. Consulte [`LICENSE`](LICENSE).

Deploy de produção sincronizado pela Vercel a partir da branch main.
