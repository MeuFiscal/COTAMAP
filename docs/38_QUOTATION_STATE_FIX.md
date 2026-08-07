# Correção do fluxo de escolha de cotação

## Causa raiz

`responder_cotacao()` marcava `quote_requests.status` como `accepted` ao receber a primeira proposta, enquanto `escolher_cotacao()` exigia `waiting`. Além de impedir a escolha do cliente, isso bloqueava respostas posteriores.

## Fluxo corrigido

1. `create-quote-request` cria a solicitação em `waiting`.
2. Respostas, recusas e promoções mantêm a solicitação em `waiting`.
3. `escolher_cotacao()` usa `FOR UPDATE`, cria o pedido, aceita a proposta escolhida, rejeita as demais, cancela notificações pendentes e muda a solicitação para `accepted`.
4. A transação e a restrição de pedido único preservam a concorrência entre abas/dispositivos.

A correção é uma migration incremental; migrations já aplicadas não foram editadas e nenhuma tabela, enum ou policy foi criada.
