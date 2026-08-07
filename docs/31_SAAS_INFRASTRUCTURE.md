# Infraestrutura SaaS Free e Premium

Auditoria: o projeto não possuía plano, features, assinatura, preço, checkout ou controle diário de uso.

A migration `20260812000000_saas_foundation.sql` cria somente as estruturas necessárias: planos Free/Premium, catálogo de features, habilitações por plano, assinatura por empresa, uso diário, checkouts e campos de promoção.

O limite de três chamados do Free é aplicado no backend por trigger transacional em `quote_notifications`, com linha diária bloqueada por `FOR UPDATE`. Premium não possui limite. O reset ocorre naturalmente pela chave `usage_date`.

As tabelas SaaS possuem RLS e leitura restrita. Alterações administrativas de planos, recursos, preço e checkout deverão ser realizadas em etapa posterior por Edge Function autenticada como Admin; nenhuma cobrança ou gateway foi integrado.
