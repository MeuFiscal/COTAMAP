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
3. O Supabase Auth cria a identidade com confirmação de e-mail desativada.
4. Se o cadastro retornar uma sessão, ela é usada imediatamente. Caso a sessão não seja retornada, o frontend realiza login com o mesmo e-mail e senha.
5. A interface mostra “Conta criada com sucesso! Redirecionando...” por aproximadamente um segundo.
6. A trigger de segurança já existente cria o `profile` relacionado ao `auth.users` e o cliente segue para o dashboard.

### Cadastro de empresa

1. O usuário escolhe “Sou uma empresa”.
2. Apenas os dados iniciais solicitados são coletados.
3. Os dados são armazenados como metadados de onboarding da identidade.
4. Nenhuma linha em `businesses` é criada nesta etapa.
5. A sessão é iniciada automaticamente usando a mesma estratégia do cadastro de cliente.
6. Após a mensagem de sucesso, o usuário segue para o placeholder `/completar-cadastro`.

> Metadados de usuário não são fonte de autorização. Papéis e vínculos empresariais continuam protegidos pelo banco e pelo RLS existentes.

### Recuperação de senha

1. `/esqueci-senha` solicita um link ao Supabase Auth.
2. `/auth/callback` troca o código PKCE por uma sessão segura.
3. `/redefinir-senha` valida e grava a nova senha.

### Confirmação de e-mail

A confirmação de e-mail está desativada no Supabase e foi removida integralmente do frontend. Não existem página de verificação, reenvio de e-mail, endpoint de confirmação, espera ou redirecionamento relacionado ao cadastro.

O endpoint `/auth/callback` permanece exclusivamente para a recuperação de senha via PKCE. Seus parâmetros de redirecionamento continuam validados para impedir redirecionamento aberto.

## Rotas

| Rota                   | Acesso                      | Objetivo                                  |
| ---------------------- | --------------------------- | ----------------------------------------- |
| `/entrar`              | Público                     | Login                                     |
| `/criar-conta`         | Público                     | Seleção do perfil inicial                 |
| `/criar-conta/cliente` | Público                     | Cadastro de cliente                       |
| `/criar-conta/empresa` | Público                     | Cadastro inicial de empresa               |
| `/esqueci-senha`       | Público                     | Solicitação de recuperação                |
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

As variáveis abaixo devem existir em `.env.local`. Como são configurações públicas expostas ao navegador, os valores de produção também ficam declarados em `.env.production`, permitindo builds reproduzíveis na Vercel sem incluir qualquer segredo:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL
```

No painel do Supabase Auth, a URL pública deve permanecer definida como Site URL e os endereços usados na recuperação de senha devem permanecer na lista de Redirect URLs. O SMTP/Brevo continua responsável apenas pelos e-mails necessários, incluindo recuperação de senha; nenhuma configuração de SMTP foi alterada nesta etapa.

## Limites desta etapa

Não foram implementados dashboard, cotações, pedidos, notificações, mapas, WhatsApp, gestão empresarial ou APIs de negócio.
