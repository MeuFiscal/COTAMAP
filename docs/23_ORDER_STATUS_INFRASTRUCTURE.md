# Infraestrutura de status do pedido

Foi publicada a Edge Function `update-order-status`, com JWT obrigatório, que delega a alteração à função transacional `atualizar_status_pedido`.

O backend valida funcionário, vínculo ativo, empresa proprietária, pedido existente, status atual e transição permitida. Cada alteração bloqueia o pedido, atualiza `updated_at` e registra auditoria com status anterior, novo status, ator e empresa. O Realtime existente em `orders` propaga a atualização para cliente e empresa.

O enum aplicado no banco possui `pending`, `preparing`, `ready`, `completed` e `cancelled`. Portanto, sem alterar o enum congelado, o fluxo suportado é `pending → preparing → ready → completed`. Os nomes de produto `accepted` e `ready_for_pickup` ficam mapeados respectivamente para o pedido criado em `pending` e o status persistido `ready`.

Não foi criado registro em `notification_logs`, pois a tabela atual representa entrega de notificações de cotação e não possui relação de status de pedido.
