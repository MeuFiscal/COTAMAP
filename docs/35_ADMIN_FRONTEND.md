# Painel administrativo — Frontend

## Escopo

O painel `/admin` foi integrado ao backend administrativo existente. O acesso é bloqueado no frontend para perfis que não possuem `profiles.role = 'admin'`; essa verificação é apenas de experiência, pois o `admin-core` valida o JWT e a permissão no backend antes de qualquer mutação.

## Dados e operações

O dashboard consulta somente dados reais das tabelas de empresas, perfis, funcionários, solicitações, cotações, pedidos e assinaturas. A classificação Free/Premium utiliza o plano ativo persistido no banco.

As alterações disponíveis nesta etapa são exclusivamente chamadas à Edge Function `admin-core`:

- atualização do limite diário configurável do plano Free;
- ativação transacional de um checkout;
- demais operações suportadas pelo backend podem ser adicionadas sem escrita direta pelo navegador.

## Limitações auditadas

O backend publicado nesta versão não expõe operações administrativas para CRUD de empresas/clientes/funcionários, envio de comunicados, leitura administrativa de auditoria ou edição completa de configurações da plataforma. Essas áreas não receberam atalhos nem escritas diretas; permanecem documentadas como dependências de uma etapa complementar de infraestrutura.

## Qualidade

React Query gerencia carregamento e invalidação, os componentes exibem estados de carregamento/erro/vazio e todas as consultas são tipadas pelo cliente Supabase. Não há mocks, valores de negócio fixos ou mutações diretas em tabelas protegidas.
