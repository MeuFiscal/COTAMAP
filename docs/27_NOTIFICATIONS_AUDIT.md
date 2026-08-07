# Auditoria e central de notificações

O projeto possui `quote_notifications`, `notification_logs`, `audit_logs` e Realtime nas entidades de cotação/pedido. Não possui tabela de notificações de aplicação, registro de dispositivos, Service Worker, tokens Web Push, provedor de Push, worker ou cron de envio.

Foi criada a rota `/notificacoes` com dados reais derivados de `quotations` e `orders`, atualização Realtime e acesso pelo sino do shell autenticado. Nenhuma escrita de leitura/exclusão foi inventada.

Marcar como lida, excluir, contador persistente e Push exigem infraestrutura complementar: tabela de notificações por usuário, tabela de dispositivos/tokens, políticas, Edge Function de distribuição e mecanismo de envio. Essa etapa não cria esses recursos para preservar as restrições do prompt.
