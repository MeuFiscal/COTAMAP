# 09 — Autenticação

## Objetivo

O módulo de autenticação do CotaMap usa exclusivamente Supabase Auth, com sessão baseada em cookies para funcionar no Next.js App Router e permanecer compatível com clientes móveis futuros. Nenhuma autenticação customizada, tabela, migration, policy ou regra de RLS foi criada nesta etapa.

## Fluxos

### Entrada

1. O usuário informa e-mail e senha em `/entrar`.
2. O Supabase Auth valida as credenciais.
3. O direcionamento considera o papel persistido em `profiles` e a intenção inicial de cadastro:
   - `customer`: `/dashboard`;
   - intenção `business`: `/completar-cadastro`;
   - `admin`: `/admin`.
4. Dashboard, área administrativa e conclusão empresarial são placeholders. Não contêm funcionalidades de negócio.

### Cadastro de cliente

1. O usuário escolhe “Sou cliente” em `/criar-conta`.
2. Nome, telefone, e-mail, senha e aceite dos termos são validados com Zod.
3. O Supabase Auth cria a identidade e envia o e-mail de confirmação.
4. A trigger de segurança já existente cria o `profile` relacionado ao `auth.users`.

### Cadastro de empresa

1. O usuário escolhe “Sou uma empresa”.
2. Apenas os dados iniciais solicitados são coletados.
3. Os dados são armazenados como metadados de onboarding da identidade.
4. Nenhuma linha em `businesses` é criada nesta etapa.
5. Após a confirmação, o usuário segue para o placeholder `/completar-cadastro`.

> Metadados de usuário não são fonte de autorização. Papéis e vínculos empresariais continuam protegidos pelo banco e pelo RLS existentes.

### Recuperação de senha

1. `/esqueci-senha` solicita um link ao Supabase Auth.
2. `/auth/callback` troca o código PKCE por uma sessão segura.
3. `/redefinir-senha` valida e grava a nova senha.

### Confirmação de e-mail

O projeto aceita os dois formatos oficiais do Supabase:

- `/auth/callback`, para links PKCE contendo `code`;
- `/auth/confirm`, para templates contendo `token_hash` e `type`.

Os parâmetros de redirecionamento são validados para impedir redirecionamento aberto.

## Rotas

| Rota                   | Acesso                      | Objetivo                                  |
| ---------------------- | --------------------------- | ----------------------------------------- |
| `/entrar`              | Público                     | Login                                     |
| `/criar-conta`         | Público                     | Seleção do perfil inicial                 |
| `/criar-conta/cliente` | Público                     | Cadastro de cliente                       |
| `/criar-conta/empresa` | Público                     | Cadastro inicial de empresa               |
| `/esqueci-senha`       | Público                     | Solicitação de recuperação                |
| `/verificar-email`     | Público                     | Orientação e reenvio de confirmação       |
| `/redefinir-senha`     | Autenticado por recuperação | Nova senha                                |
| `/perfil`              | Privado                     | Consulta e atualização de nome e telefone |
| `/dashboard`           | Privado                     | Placeholder do cliente                    |
| `/completar-cadastro`  | Privado                     | Placeholder empresarial                   |
| `/admin`               | Privado e papel `admin`     | Placeholder administrativo                |
| `/acesso-negado`       | Público                     | Falta de permissão                        |
| `not-found`            | Público                     | Página 404 personalizada                  |

## Proteção de sessão

`src/proxy.ts` renova os cookies de autenticação e bloqueia rotas privadas sem claims válidos. Os layouts e páginas privadas também validam o usuário no servidor com `auth.getUser()`. A área administrativa consulta `profiles.role` antes de renderizar.

O RLS continua sendo a última barreira de autorização. A proteção de rota melhora a experiência, mas não substitui as policies do banco.

## Organização

- `src/providers/auth-provider.tsx`: sincroniza o estado de sessão no cliente.
- `src/contexts/auth-context.tsx`: contrato global da autenticação.
- `src/hooks/use-auth.ts`: acesso tipado ao contexto.
- `src/services/auth/auth-service.ts`: operações de Auth e perfil.
- `src/lib/supabase`: clientes Browser, Server e atualização de cookies.
- `src/features/auth/schemas`: validações Zod.
- `src/features/auth/components`: formulários e componentes reutilizáveis.
- `src/features/auth/server`: verificações privadas executadas no servidor.
- `src/types/auth.ts`: contratos compartilhados, reutilizáveis em clientes móveis.

## Validação e acessibilidade

Os formulários usam React Hook Form e Zod, não usam `any` e exibem mensagens amigáveis. Telefone e CEP têm máscaras visuais, mas são enviados sem pontuação. Todos os controles possuem labels, estados de erro associados por ARIA, foco visível e navegação por teclado.

## Configuração necessária

As variáveis abaixo devem existir em `.env.local` e nos ambientes da Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

No painel do Supabase Auth, a URL pública deve ser definida como Site URL e os endereços locais/de preview usados pela equipe devem entrar na lista de Redirect URLs. Para o formato `token_hash`, o template de e-mail deve apontar para `/auth/confirm`.

## Limites desta etapa

Não foram implementados dashboard, cotações, pedidos, notificações, mapas, WhatsApp, gestão empresarial ou APIs de negócio.
