# Painel da Autopeça

## Escopo

O painel operacional permite que membros autorizados de uma empresa acompanhem chamados destinados à própria empresa e respondam com uma cotação. Não há dados simulados: a interface consome exclusivamente o Supabase.

## Rotas

- `/empresa/chamados`: lista de notificações da empresa autenticada, ordenadas pelas mais recentes.
- `/empresa/chamados/[id]`: detalhes do chamado, expiração e ações de aceitar ou recusar.
- `/empresa/cotacoes`: cotações enviadas pela empresa, com filtros por período, status e peça.

## Integração

`business-service.ts` resolve a empresa do usuário pela associação em `business_employees`, consulta `quote_notifications` e `quote_requests`, e invoca exclusivamente a Edge Function `respond-quotation` para aceitar ou recusar. O frontend não grava diretamente em tabelas protegidas.

Fotos são enviadas ao bucket privado `quotation-images` antes da chamada da Edge Function. A função existente valida associação, concorrência, prazo e grava a resposta de forma transacional.

## Realtime e estados

`use-business-calls` mantém uma assinatura Realtime em `quote_notifications` e invalida o cache React Query quando há mudanças. As telas tratam carregamento, erro, ausência de chamados/cotações, offline e solicitação encerrada. O formulário é desabilitado após a expiração e informa quando outro colaborador já respondeu.

## Componentes e validação

O layout compartilhado fica em `BusinessShell`; `CallResponseForm` usa React Hook Form e Zod, com suporte a câmera, galeria e desktop. Tipos são estritos e as verificações de TypeScript, ESLint e build são executadas no CI/publicação.
