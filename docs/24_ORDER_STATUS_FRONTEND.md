# Frontend de operação do pedido

O painel empresarial agora exibe somente a próxima transição válida e a executa exclusivamente pela Edge Function `update-order-status`. As telas do cliente e da empresa compartilham consultas React Query e assinaturas Realtime em `orders`, mantendo a timeline atualizada sem polling.

Transições suportadas pelo backend: `pending → preparing → ready → completed`. A interface não oferece regressão nem saltos de status. Erros da Edge Function são apresentados ao operador e nenhuma tabela é alterada diretamente pelo navegador.
