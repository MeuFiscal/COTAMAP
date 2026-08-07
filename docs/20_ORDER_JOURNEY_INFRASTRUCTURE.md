# Infraestrutura da jornada do pedido

A Edge Function `choose-quotation` executa a escolha do cliente com JWT obrigatório e delega a operação transacional à função SQL `escolher_cotacao`.

Em uma única transação, a função bloqueia a cotação e a solicitação, valida a propriedade e a expiração, cria `orders`, aceita a cotação escolhida, rejeita as demais, marca a solicitação como `accepted`, cancela notificações pendentes e registra auditoria. O índice único de pedidos e os bloqueios `FOR UPDATE` protegem contra dois dispositivos concluírem simultaneamente.

O Realtime existente nas tabelas `orders`, `quotations`, `quote_requests` e `quote_notifications` propaga as alterações sem necessidade de nova configuração.

O enum existente `quote_status` não possui `completed`; por compatibilidade, a solicitação é marcada como `accepted`, enquanto o pedido inicia em `pending`.
