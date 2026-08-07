# Painel administrativo — Frontend

## Escopo

O painel `/admin` foi integrado ao backend administrativo existente. A fonte oficial de autorização é `platform_admins.active`, vinculada ao usuário autenticado pelo e-mail do Supabase Auth. O frontend usa essa mesma fonte apenas para experiência; o `admin-core`, as RPCs e `private.is_admin()` validam novamente o JWT no backend antes de qualquer mutação ou leitura protegida.

## Dados e operações

O dashboard consulta somente dados reais das tabelas de empresas, perfis, funcionários, solicitações, cotações, pedidos e assinaturas. A classificação Free/Premium utiliza o plano ativo persistido no banco.

As alterações disponíveis nesta etapa são exclusivamente chamadas à Edge Function `admin-core`:

- atualização do limite diário configurável do plano Free;
- ativação transacional de um checkout;
- demais operações suportadas pelo backend podem ser adicionadas sem escrita direta pelo navegador.

O painel também consolida consultas somente leitura para Empresas, Clientes, Funcionários e Auditoria, usando RLS existente e limite inicial de 100 eventos de auditoria. Filtros avançados, paginação server-side e operações de status dependem de endpoints administrativos que ainda não estão publicados.

## Limitações auditadas

O backend publicado nesta versão não expõe operações administrativas para CRUD de empresas/clientes/funcionários, envio de comunicados, leitura administrativa de auditoria ou edição completa de configurações da plataforma. Essas áreas não receberam atalhos nem escritas diretas; permanecem documentadas como dependências de uma etapa complementar de infraestrutura.

## Qualidade

React Query gerencia carregamento e invalidação, os componentes exibem estados de carregamento/erro/vazio e todas as consultas são tipadas pelo cliente Supabase. Não há mocks, valores de negócio fixos ou mutações diretas em tabelas protegidas.
